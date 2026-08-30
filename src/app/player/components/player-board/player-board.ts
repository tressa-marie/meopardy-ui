import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService } from '../../../core/services/socket/socker.service';
import { PlayerSessionService } from '../../services/player-session.service';
import { PlayerClueStateService } from '../../services/player-clue-state.service';

@Component({
  selector: 'app-player-board',
  standalone: true,
  imports: [],
  templateUrl: './player-board.html',
  styleUrl: './player-board.scss',
})
export class PlayerBoardComponent implements OnInit, OnDestroy {
  private readonly socketService = inject(SocketService);
  private readonly playerClueStateService = inject(PlayerClueStateService);
  private readonly router = inject(Router);
  private readonly playerSessionService = inject(PlayerSessionService);
  private readonly gameId = this.playerSessionService.getGameId();

  ngOnInit(): void {
    console.log('[PlayerBoardComponent] ngOnInit', { gameId: this.gameId });
    if (!this.gameId) {
      void this.router.navigate(['/join']);
      return;
    }

    this.socketService.joinPlayerGame(this.gameId);
    this.socketService.onClueSelected(clue => {
      console.log('[PlayerBoardComponent] clue selected, navigating to /player-answer', { clue });
      this.playerClueStateService.setSelectedClue(clue);
      void this.router.navigate(['/player-answer']);
    });
    this.socketService.onClueClosed(() => {
      console.log('[PlayerBoardComponent] received clue closed');
      this.playerClueStateService.clearSelectedClue();
    });
  }

  ngOnDestroy(): void {
    console.log('[PlayerBoardComponent] ngOnDestroy');
    this.socketService.offClueSelected();
    this.socketService.offClueClosed();
  }
}
