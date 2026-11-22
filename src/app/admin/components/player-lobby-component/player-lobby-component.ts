import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { injectRouteGameId } from '../../../core/routing/game-id';
import { SocketService } from '../../../core/services/socket/socker.service';

@Component({
  selector: 'app-player-lobby-component', standalone: true, imports: [RouterLink],
  templateUrl: './player-lobby-component.html', styleUrl: './player-lobby-component.scss',
})
export class PlayerLobbyComponent {
  readonly gameId = injectRouteGameId();
  readonly game = inject(SocketService);
  readonly starting = signal(false);
  readonly errorMessage = signal('');
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.game.joinGame(this.gameId);
    effect(() => {
      const state = this.game.state();
      if (this.game.synchronized() && state && state.status !== 'setup') {
        void this.router.navigate(['/host', this.gameId], { replaceUrl: true });
      }
    });
  }

  get players() { return this.game.state()?.players ?? []; }

  async startGame(): Promise<void> {
    if (this.starting() || !this.game.synchronized()) return;
    this.starting.set(true);
    this.errorMessage.set('');
    try {
      await this.game.startGame(this.gameId);
      if (!this.destroyRef.destroyed) await this.router.navigate(['/host', this.gameId]);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Could not start the game.');
    } finally { this.starting.set(false); }
  }
}
