import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Player } from '../../../models/player';
import { PlayerService } from '../../../player/services/player-api';
import { SocketService } from '../../../core/services/socket/socker.service';
import { Subject, timer } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-player-lobby-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-lobby-component.html',
  styleUrl: './player-lobby-component.scss',
})
export class PlayerLobbyComponent implements OnInit, OnDestroy {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly playerService = inject(PlayerService);
  private readonly socketService = inject(SocketService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private setupTimer: ReturnType<typeof setTimeout> | null = null;

  players: Player[] = [];

  gameId = environment.gameId;

  ngOnInit(): void {
    console.log('[PlayerLobbyComponent] ngOnInit', { gameId: this.gameId });
    this.setupTimer = setTimeout(() => {
      this.loadPlayers();
      this.socketService.joinGame(this.gameId);
      this.socketService.onPlayersUpdated(() => {
        console.log('[PlayerLobbyComponent] socket-triggered refresh');
        this.loadPlayers();
      });
      this.socketService.onGameStarted(() => {
        console.log('[PlayerLobbyComponent] game started, navigating to /host');
        void this.router.navigate(['/host']);
      });

      timer(3000, 3000)
        .pipe(
          takeUntil(this.destroy$),
          switchMap(() => this.playerService.getPlayers(this.gameId))
        )
        .subscribe({
          next: players => {
            console.log('[PlayerLobbyComponent] poll returned players', { count: players.length, players });
            this.players = players;
            this.changeDetectorRef.detectChanges();
          },
          error: error => {
            console.log('[PlayerLobbyComponent] poll failed', { error });
          },
        });
    }, 0);
  }

  ngOnDestroy(): void {
    console.log('[PlayerLobbyComponent] ngOnDestroy');
    this.socketService.offPlayersUpdated();
    this.socketService.offGameStarted();
    if (this.setupTimer) {
      clearTimeout(this.setupTimer);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  startGame(): void {
    console.log('[PlayerLobbyComponent] Start Game clicked', { gameId: this.gameId });
    this.socketService.startGame(this.gameId);
    void this.router.navigate(['/host']);
  }

  private loadPlayers(): void {
    console.log('[PlayerLobbyComponent] loadPlayers start', { gameId: this.gameId });
    this.playerService.getPlayers(this.gameId).subscribe({
      next: players => {
        console.log('[PlayerLobbyComponent] loadPlayers success', { count: players.length, players });
        this.players = players;
        this.changeDetectorRef.detectChanges();
      },
      error: error => {
        console.log('[PlayerLobbyComponent] loadPlayers error', { error });
      },
    });
  }
}
