import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PlayerService } from '../../services/player-api';

@Component({
  selector: 'app-player-join',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-join.html',
  styleUrl: './player-join.scss',
})
export class PlayerJoinComponent {
  readonly gameTitle = 'Meopardy'; // TODO: Get from config
  joinCode = '';
  playerName = '';
  errorMessage = '';
  loading = true;

  constructor(
    private playerService: PlayerService,
    private router: Router,
  ) {}

  onJoinCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.joinCode = input.value.slice(0, 6);
  }

  onPlayerNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.playerName = input.value.slice(0, 20);
  }

  joinGame(): void {
    this.playerService.joinGame(this.joinCode, this.playerName).subscribe({
      next: () => {
        this.loading = false;
        void this.router.navigate(['/join-confirmation']);
      },
      error: () => {
        this.errorMessage = 'Could not load the game board.';
        this.loading = false;
      }
    });
  }
}
