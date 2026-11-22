import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Clue } from '../../../models/clue';
import { SocketService } from '../../../core/services/socket/socker.service';
import { injectRouteGameId } from '../../../core/routing/game-id';

@Component({
  selector: 'app-game-board-component', standalone: true, imports: [RouterLink],
  templateUrl: './game-board-component.component.html', styleUrl: './game-board-component.component.scss',
})
export class GameBoardComponentComponent implements OnInit {
  readonly gameId = injectRouteGameId();
  readonly game = inject(SocketService);
  readonly busy = signal(false);
  readonly errorMessage = signal('');
  readonly clueRows = computed(() => Math.max(1,
    ...(this.game.state()?.categories.map(category => category.clues.length) ?? [])));

  ngOnInit(): void { this.game.joinGame(this.gameId); }
  get board() { return this.game.state(); }
  get selectedClue() { return this.game.activeClue(); }
  get loading() { return !this.game.synchronized() && !this.game.error(); }

  async selectClue(clue: Clue): Promise<void> {
    if (clue.isAnswered || clue.isPlayed || this.game.state()?.status !== 'board') return;
    await this.perform(() => this.game.selectClue(this.gameId, { id: clue.id }));
  }

  async closeClue(): Promise<void> {
    const clueId = this.selectedClue?.id;
    if (clueId) await this.perform(() => this.game.closeClue(this.gameId, clueId));
  }

  async revealAnswer(): Promise<void> {
    const clueId = this.selectedClue?.id;
    if (clueId) await this.perform(() => this.game.revealClue(this.gameId, clueId));
  }

  private async perform(action: () => Promise<void>): Promise<void> {
    if (this.busy() || !this.game.synchronized()) return;
    this.busy.set(true);
    this.errorMessage.set('');
    try { await action(); }
    catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Could not update the game.');
      await this.game.sync().catch(() => undefined);
    } finally { this.busy.set(false); }
  }
}
