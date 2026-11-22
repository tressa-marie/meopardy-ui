import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { PlayerService } from '../../services/player-api';
import { PlayerSessionService } from '../../services/player-session.service';

@Component({
  selector: 'app-player-join',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-join.html',
  styleUrl: './player-join.scss',
})
export class PlayerJoinComponent {
  readonly gameTitle = 'Meopardy'; // TODO: Get from config
  private readonly playerService = inject(PlayerService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly playerSessionService = inject(PlayerSessionService);
  private readonly router = inject(Router);
  joinCode = '';
  playerName = '';
  errorMessage = '';
  loading = false;

  onJoinCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.joinCode = input.value.replace(/\s+/g, '').slice(0, 6).toUpperCase();
    this.errorMessage = '';
  }

  onPlayerNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.playerName = input.value.slice(0, 20);
    this.errorMessage = '';
  }

  joinGame(): void {
    const joinCode = this.joinCode.trim();
    const playerName = this.playerName.trim();

    if (joinCode.length !== 6) {
      this.errorMessage = 'Enter the 6-character join code.';
      return;
    }

    if (!playerName) {
      this.errorMessage = 'Enter a player name.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.playerService.joinGame(joinCode, playerName).subscribe({
      next: player => {
        this.playerSessionService.savePlayer(player);
        this.loading = false;
        void this.router.navigate(['/join-confirmation']);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.getJoinErrorMessage(error);
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  private getJoinErrorMessage(error: HttpErrorResponse): string {
    const apiMessage = error.error?.message ?? error.error?.error;

    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage;
    }

    if (error.status === 0) {
      return 'Could not reach the game server. Make sure the backend is running on port 3000.';
    }

    if (error.status === 400) {
      return 'The join code or player name was rejected. Double-check both fields and try again.';
    }

    if (error.status === 404) {
      return 'No game was found for that join code.';
    }

    return 'Could not join the game right now. Please try again.';
  }
}
