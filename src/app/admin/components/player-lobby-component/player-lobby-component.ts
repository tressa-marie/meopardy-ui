import { Component, inject } from '@angular/core';
import { PlayerService } from '../../../player/services/player-api';

@Component({
  selector: 'app-player-lobby-component',
  imports: [],
  templateUrl: './player-lobby-component.html',
  styleUrl: './player-lobby-component.scss',
})
export class PlayerLobbyComponent {
    private readonly playerService = inject(PlayerService);
}
