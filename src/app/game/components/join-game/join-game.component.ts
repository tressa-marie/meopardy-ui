import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GameService } from '../../services/game-api';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-join-game',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './join-game.component.html',
  styleUrl: './join-game.component.scss'
})
export class JoinGameComponent implements OnInit {
  private readonly gameId = environment.gameId;
  joinCode: string = '';
  loading = true;
  errorMessage = '';
  private readonly gameService = inject(GameService);

  ngOnInit(): void {
    this.gameService.getJoinCode(this.gameId).subscribe({
      next: joinCode => {
        this.joinCode = joinCode.toString();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load the game.';
        this.loading = false;
      }
    });
  }
}
