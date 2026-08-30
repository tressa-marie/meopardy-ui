import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService } from '../../../core/services/socket/socker.service';
import { PlayerSessionService } from '../../services/player-session.service';

@Component({
  selector: 'app-player-join-confirmation',
  standalone: true,
  imports: [],
  templateUrl: './player-join-confirmation.html',
  styleUrl: './player-join-confirmation.scss',
})
export class PlayerJoinConfirmationComponent implements OnInit, OnDestroy {
  private readonly socketService = inject(SocketService);
  private readonly router = inject(Router);
  private readonly playerSessionService = inject(PlayerSessionService);
  private readonly gameId = this.playerSessionService.getGameId();

  ngOnInit(): void {
    console.log('[PlayerJoinConfirmationComponent] ngOnInit', { gameId: this.gameId });
    if (!this.gameId) {
      void this.router.navigate(['/join']);
      return;
    }

    this.socketService.joinPlayerGame(this.gameId);
    this.socketService.onGameStarted(() => {
      console.log('[PlayerJoinConfirmationComponent] game started, navigating to /player-board');
      void this.router.navigate(['/player-board']);
    });
  }

  ngOnDestroy(): void {
    console.log('[PlayerJoinConfirmationComponent] ngOnDestroy');
    this.socketService.offGameStarted();
  }
}
