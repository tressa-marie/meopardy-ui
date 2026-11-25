import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { injectRouteGameId } from '../../../core/routing/game-id';
import { SocketService } from '../../../core/services/socket/socker.service';
import { GameSettingsComponent } from '../game-settings/game-settings';

@Component({
  selector: 'app-player-lobby-component', standalone: true, imports: [GameSettingsComponent],
  templateUrl: './player-lobby-component.html', styleUrl: './player-lobby-component.scss',
})
export class PlayerLobbyComponent {
  readonly gameId = injectRouteGameId();
  readonly game = inject(SocketService);
  readonly starting = signal(false);
  readonly errorMessage = signal('');
  readonly changingTheme = signal(false);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.game.joinGame(this.gameId);
  }

  get players() { return this.game.state()?.players ?? []; }

  async startGame(): Promise<void> {
    if (this.starting() || this.changingTheme() || !this.game.synchronized()) return;
    this.starting.set(true);
    this.errorMessage.set('');
    try {
      await this.game.startGame(this.gameId);
      if (!this.destroyRef.destroyed) await this.router.navigate(['/admin-dashboard', this.gameId]);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Could not start the game.');
    } finally { this.starting.set(false); }
  }
}
