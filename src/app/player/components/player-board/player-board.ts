import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { bindPlayerGame } from '../../services/player-game';

@Component({
  selector: 'app-player-board', standalone: true, imports: [RouterLink],
  templateUrl: './player-board.html', styleUrl: './player-board.scss',
})
export class PlayerBoardComponent {
  readonly game = bindPlayerGame();
}
