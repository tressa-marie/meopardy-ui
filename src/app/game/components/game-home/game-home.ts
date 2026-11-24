import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-game-home', standalone: true, imports: [RouterLink],
  templateUrl: './game-home.html', styleUrl: './game-home.scss',
})
export class GameHomeComponent {
  readonly gameTitle = environment.gameTitle;
}
