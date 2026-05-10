import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

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

  onJoinCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.joinCode = input.value.replace(/\D/g, '').slice(0, 6);
  }

  onPlayerNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.playerName = input.value.slice(0, 20);
  }

  joinGame(): void {
    console.log('Join clicked', this.joinCode, this.playerName);
  }
}
