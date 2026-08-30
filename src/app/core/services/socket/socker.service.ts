import { Injectable, NgZone, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Player } from '../../../models/player';
import { environment } from '../../../../environments/environment';
import { Clue } from '../../../models/clue';
import { SubmittedAnswer } from '../../../admin/models/submitted-answer';
import { ThemeName } from '../theme/theme.service';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private readonly socket: Socket;
  private readonly ngZone = inject(NgZone);
  private readonly serverUrl = environment.socketUrl;

  constructor() {
    this.socket = io(this.serverUrl);
    this.socket.on('connect', () => {
      console.log('[SocketService] connected', {
        id: this.socket.id,
        serverUrl: this.serverUrl,
      });
    });
    this.socket.on('disconnect', reason => {
      console.log('[SocketService] disconnected', { reason });
    });
  }

  joinGame(gameId: number): void {
    console.log('[SocketService] emit admin:joinGame', { gameId });
    this.socket.emit('admin:joinGame', { gameId });
  }

  joinPlayerGame(gameId: number): void {
    console.log('[SocketService] emit player:joinGame', { gameId });
    this.socket.emit('player:joinGame', { gameId });
  }

  notifyPlayerJoined(gameId: number): void {
    console.log('[SocketService] emit player:joined', { gameId });
    this.socket.emit('player:joined', { gameId });
  }

  startGame(gameId: number): void {
    console.log('[SocketService] emit game:start', { gameId });
    this.socket.emit('game:start', { gameId });
  }

  setTheme(gameId: number, theme: ThemeName): void {
    console.log('[SocketService] emit game:themeChanged', { gameId, theme });
    this.socket.emit('game:themeChanged', { gameId, theme });
  }

  selectClue(gameId: number, clue: Clue): void {
    console.log('[SocketService] emit game:clueSelected', { gameId, clue });
    this.socket.emit('game:clueSelected', { gameId, clue });
  }

  closeClue(gameId: number): void {
    console.log('[SocketService] emit game:clueClosed', { gameId });
    this.socket.emit('game:clueClosed', { gameId });
  }

  submitAnswer(gameId: number, answer: SubmittedAnswer): void {
    console.log('[SocketService] emit game:answerSubmitted', { gameId, answer });
    this.socket.emit('game:answerSubmitted', { gameId, answer });
  }

  onPlayersUpdated(callback: (players?: Player[]) => void): void {
    this.socket.off('players:updated');
    this.socket.on('players:updated', (players: Player[]) => {
      console.log('[SocketService] received players:updated', { players });
      this.ngZone.run(() => callback(players));
    });
  }

  onGameStarted(callback: () => void): void {
    this.socket.off('game:started');
    this.socket.on('game:started', () => {
      console.log('[SocketService] received game:started');
      this.ngZone.run(() => callback());
    });
  }

  onThemeChanged(callback: (theme: ThemeName) => void): void {
    this.socket.off('game:themeChanged');
    this.socket.on('game:themeChanged', (payload: { theme?: ThemeName } | ThemeName) => {
      const theme = this.extractTheme(payload);
      if (!theme) {
        console.log('[SocketService] received game:themeChanged with no theme payload', { payload });
        return;
      }
      console.log('[SocketService] received game:themeChanged', { theme });
      this.ngZone.run(() => callback(theme));
    });
  }

  onClueSelected(callback: (clue: Clue) => void): void {
    this.socket.off('game:clueSelected');
    this.socket.on('game:clueSelected', (payload: { clue?: Clue } | Clue) => {
      const clue = this.extractClue(payload);
      if (!clue) {
        console.log('[SocketService] received game:clueSelected with no clue payload', { payload });
        return;
      }
      console.log('[SocketService] received game:clueSelected', { clue });
      this.ngZone.run(() => callback(clue));
    });
  }

  onClueClosed(callback: () => void): void {
    this.socket.off('game:clueClosed');
    this.socket.on('game:clueClosed', () => {
      console.log('[SocketService] received game:clueClosed');
      this.ngZone.run(() => callback());
    });
  }

  onAnswerSubmitted(callback: (answer: SubmittedAnswer) => void): void {
    this.socket.off('game:answerSubmitted');
    this.socket.on('game:answerSubmitted', (payload: { answer?: SubmittedAnswer } | SubmittedAnswer) => {
      const answer = this.extractSubmittedAnswer(payload);
      if (!answer) {
        console.log('[SocketService] received game:answerSubmitted with no answer payload', { payload });
        return;
      }
      console.log('[SocketService] received game:answerSubmitted', { answer });
      this.ngZone.run(() => callback(answer));
    });
  }

  offPlayersUpdated(): void {
    this.socket.off('players:updated');
  }

  offGameStarted(): void {
    this.socket.off('game:started');
  }

  offThemeChanged(): void {
    this.socket.off('game:themeChanged');
  }

  offClueSelected(): void {
    this.socket.off('game:clueSelected');
  }

  offClueClosed(): void {
    this.socket.off('game:clueClosed');
  }

  offAnswerSubmitted(): void {
    this.socket.off('game:answerSubmitted');
  }

  private extractSubmittedAnswer(payload: { answer?: SubmittedAnswer } | SubmittedAnswer): SubmittedAnswer | undefined {
    const candidate = this.hasAnswerWrapper(payload) ? payload.answer : payload;

    return this.isSubmittedAnswer(candidate) ? candidate : undefined;
  }

  private extractClue(payload: { clue?: Clue } | Clue): Clue | undefined {
    const candidate = this.hasClueWrapper(payload) ? payload.clue : payload;

    return this.normalizeClue(candidate);
  }

  private hasClueWrapper(payload: { clue?: Clue } | Clue): payload is { clue?: Clue } {
    return typeof payload === 'object' && payload !== null && 'clue' in payload;
  }

  private hasAnswerWrapper(payload: { answer?: SubmittedAnswer } | SubmittedAnswer): payload is { answer?: SubmittedAnswer } {
    return typeof payload === 'object' && payload !== null && 'answer' in payload;
  }

  private extractTheme(payload: { theme?: ThemeName } | ThemeName): ThemeName | undefined {
    const candidate = this.hasThemeWrapper(payload) ? payload.theme : payload;
    return this.isThemeName(candidate) ? candidate : undefined;
  }

  private hasThemeWrapper(payload: { theme?: ThemeName } | ThemeName): payload is { theme?: ThemeName } {
    return typeof payload === 'object' && payload !== null && 'theme' in payload;
  }

  private isThemeName(value: unknown): value is ThemeName {
    return value === 'classic' || value === 'pastel-holiday';
  }

  private normalizeClue(candidate: unknown): Clue | undefined {
    if (typeof candidate !== 'object' || candidate === null) {
      return undefined;
    }

    const clue = candidate as Partial<Clue>;

    if (
      typeof clue.id !== 'number' ||
      typeof clue.categoryId !== 'number' ||
      typeof clue.question !== 'string' ||
      typeof clue.correctAnswer !== 'string'
    ) {
      return undefined;
    }

    return {
      id: clue.id,
      categoryId: clue.categoryId,
      categoryName: typeof clue.categoryName === 'string' ? clue.categoryName : '',
      basePoints: typeof clue.basePoints === 'number' ? clue.basePoints : 0,
      question: clue.question,
      correctAnswer: clue.correctAnswer,
      isAnswered:
        typeof clue.isAnswered === 'boolean'
          ? clue.isAnswered
          : typeof clue.isAnswered === 'number'
            ? clue.isAnswered > 0
            : false,
    };
  }

  private isSubmittedAnswer(candidate: unknown): candidate is SubmittedAnswer {
    if (typeof candidate !== 'object' || candidate === null) {
      return false;
    }

    const answer = candidate as Partial<SubmittedAnswer>;

    return (
      typeof answer.clueId === 'number' &&
      typeof answer.playerId === 'number' &&
      typeof answer.submittedAnswer === 'string' &&
      typeof answer.responseTimeMs === 'number' &&
      (typeof answer.isCorrect === 'boolean' || answer.isCorrect === null)
    );
  }
}
