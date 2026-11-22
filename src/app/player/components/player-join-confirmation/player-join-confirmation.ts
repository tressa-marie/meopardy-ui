import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { bindPlayerGame } from '../../services/player-game';

@Component({
  selector: 'app-player-join-confirmation', standalone: true, imports: [RouterLink],
  templateUrl: './player-join-confirmation.html', styleUrl: './player-join-confirmation.scss',
})
export class PlayerJoinConfirmationComponent {
  readonly game = bindPlayerGame();
}
