import { computed, inject, Injectable, InjectionToken, OnDestroy, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../../environments/environment';
import { GameState, AnswerReceipt, normalizeAnswer, normalizeState } from '../../../models/game-state';
import { SubmittedAnswer } from '../../../admin/models/submitted-answer';
import { PlayerSessionService } from '../../../player/services/player-session.service';
import { ThemeName } from '../theme/theme.service';

export const SOCKET_FACTORY = new InjectionToken<(url: string) => Socket>('SOCKET_FACTORY', {
  providedIn: 'root', factory: () => url => io(url, { autoConnect: false }),
});

interface Membership { gameId: number; role: 'admin' | 'player'; sessionToken?: string }
interface Acknowledgment<T> { ok: boolean; result: T; message?: string }

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private readonly session = inject(PlayerSessionService);
  private readonly socket = inject(SOCKET_FACTORY)(environment.socketUrl);
  private membership?: Membership;
  private generation = 0;
  private readonly snapshot = signal<GameState | null>(null);
  readonly state = this.snapshot.asReadonly();
  readonly connected = signal(false);
  readonly synchronized = signal(false);
  readonly error = signal('');
  readonly ownAnswer = signal<SubmittedAnswer | null>(null);
  private readonly answerSnapshot = signal<{ clueId: number | null; answers: SubmittedAnswer[] }>({ clueId: null, answers: [] });
  readonly activeClue = computed(() => {
    const state = this.state();
    return state && ['clue_open', 'answering', 'awaiting_reveal', 'reveal'].includes(state.status) ? state.activeClue : null;
  });
  readonly answers = computed(() => this.answerSnapshot().clueId === this.activeClue()?.id
    ? this.answerSnapshot().answers : []);
  readonly now = signal(Date.now());
  private readonly serverOffset = signal(0);
  readonly remainingSeconds = computed(() => {
    const deadline = this.state()?.timing?.deadlineAt;
    return deadline == null ? 0 : Math.max(0, Math.ceil((deadline - this.now() - this.serverOffset()) / 1000));
  });
  readonly acceptingAnswers = computed(() => this.synchronized() && this.connected()
    && this.state()?.status === 'answering' && this.remainingSeconds() > 0);
  private readonly ticker: ReturnType<typeof setInterval>;
  private readonly recovery: ReturnType<typeof setInterval>;

  constructor() {
    this.socket.on('connect', () => {
      this.connected.set(true);
      void this.rejoin();
    });
    this.socket.on('disconnect', () => {
      this.generation++;
      this.connected.set(false);
      this.synchronized.set(false);
    });
    this.socket.on('connect_error', () => this.error.set('Could not connect to the game server. Reconnecting…'));
    this.socket.on('game:state', (state: GameState) => this.applyState(state));
    this.socket.on('player:state', (payload: { player: NonNullable<GameState['player']>; ownAnswer: SubmittedAnswer | null }) => {
      if (this.membership?.role !== 'player' || payload.player.gameId !== this.membership.gameId) return;
      this.ownAnswer.set(payload.ownAnswer ? normalizeAnswer(payload.ownAnswer) : null);
      this.session.updatePlayer(payload.player);
    });
    this.socket.on('game:answers', (payload: { gameId: number; clueId: number | null; answers: SubmittedAnswer[] }) => {
      if (this.membership?.role !== 'admin' || payload.gameId !== this.membership.gameId) return;
      const unique = new Map(payload.answers.map(answer => [answer.id, normalizeAnswer(answer)]));
      this.answerSnapshot.set({ clueId: payload.clueId, answers: [...unique.values()] });
    });
    this.ticker = setInterval(() => this.now.set(Date.now()), 250);
    // Recover missed events even when the transport did not fully disconnect.
    this.recovery = setInterval(() => {
      if (this.connected() && this.membership) void this.sync().catch(() => undefined);
    }, 10000);
    this.socket.connect();
  }

  joinGame(gameId: number): void { this.join({ gameId, role: 'admin' }); }

  joinPlayerGame(gameId: number): void {
    this.join({ gameId, role: 'player', sessionToken: this.session.getPlayer()?.sessionToken });
  }

  private join(membership: Membership): void {
    if (JSON.stringify(this.membership) === JSON.stringify(membership) && this.synchronized()) return;
    this.generation++;
    this.membership = membership;
    this.synchronized.set(false);
    this.snapshot.set(null);
    this.ownAnswer.set(null);
    this.answerSnapshot.set({ clueId: null, answers: [] });
    if (this.connected()) void this.rejoin();
  }

  private async rejoin(): Promise<void> {
    const membership = this.membership;
    if (!membership) return;
    const generation = ++this.generation;
    if (membership.role === 'player' && !membership.sessionToken) {
      this.error.set('Your player session has expired. Please rejoin the game.');
      return;
    }
    try {
      const state = await this.command<GameState>(`${membership.role}:joinGame`, membership);
      if (generation !== this.generation) return;
      this.applyState(state);
      this.synchronized.set(true);
      this.error.set('');
    } catch (error) {
      if (generation === this.generation) this.error.set(this.message(error));
    }
  }

  private applyState(raw: GameState): void {
    if (raw.id !== this.membership?.gameId) return;
    const state = normalizeState(raw);
    this.serverOffset.set(state.serverNow - Date.now());
    this.now.set(Date.now());
    this.snapshot.set(state);
    if (state.ownAnswer !== undefined) this.ownAnswer.set(state.ownAnswer);
    if (state.player) this.session.updatePlayer(state.player);
  }

  async sync(): Promise<void> {
    if (!this.synchronized()) { await this.rejoin(); return; }
    const generation = this.generation;
    const state = await this.command<GameState>('game:sync', {});
    if (generation === this.generation) this.applyState(state);
  }

  private async command<T>(event: string, payload: unknown): Promise<T> {
    if (!this.socket.connected) throw new Error('Connection lost. Please wait for reconnection.');
    let response: Acknowledgment<T>;
    try {
      response = await this.socket.timeout(10000).emitWithAck(event, payload);
    } catch {
      throw new Error('The server did not confirm the action. Reconnect and retry; saved progress is preserved.');
    }
    if (!response.ok) throw new Error(response.message || 'The server rejected the action.');
    return response.result;
  }

  private async gameAction(event: string, payload: object): Promise<void> {
    const generation = this.generation;
    const state = await this.command<GameState>(event, payload);
    if (generation === this.generation) this.applyState(state);
  }

  startGame(gameId: number): Promise<void> { return this.gameAction('game:start', { gameId }); }
  selectClue(gameId: number, clue: { id: number }): Promise<void> {
    return this.gameAction('game:clueSelected', { gameId, clue: { id: clue.id } });
  }
  closeClue(gameId: number, clueId: number): Promise<void> {
    return this.gameAction('game:clueClosed', { gameId, clueId });
  }
  revealClue(gameId: number, clueId: number): Promise<void> {
    return this.gameAction('game:clueRevealed', { gameId, clueId });
  }
  setTheme(gameId: number, theme: ThemeName): Promise<void> {
    return this.gameAction('game:themeChanged', { gameId, theme });
  }
  submitAnswer(clueId: number, submittedAnswer: string): Promise<AnswerReceipt> {
    return this.command('game:answerSubmitted', { clueId, submittedAnswer });
  }
  onThemeChanged(callback: (theme: ThemeName) => void): () => void {
    const listener = (payload: { theme: ThemeName }) => callback(payload.theme);
    this.socket.on('game:themeChanged', listener);
    return () => this.socket.off('game:themeChanged', listener);
  }
  private message(error: unknown): string { return error instanceof Error ? error.message : 'Could not synchronize the game.'; }

  ngOnDestroy(): void {
    clearInterval(this.ticker);
    clearInterval(this.recovery);
    this.socket.disconnect();
  }
}
