import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { GameService } from '../../services/game-api';
import { SocketService } from '../../../core/services/socket/socker.service';
import { injectRouteGameId } from '../../../core/routing/game-id';

@Component({
  selector: 'app-join-game', standalone: true, imports: [],
  templateUrl: './join-game.component.html', styleUrl: './join-game.component.scss',
})
export class JoinGameComponent implements OnInit {
  readonly gameId = injectRouteGameId();
  readonly game = inject(SocketService);
  readonly starting = signal(false);
  readonly actionError = signal('');
  joinCode = '';
  loading = true;
  errorMessage = '';
  private readonly gameService = inject(GameService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.game.joinGame(this.gameId);
    this.gameService.getJoinCode(this.gameId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: joinCode => { this.joinCode = joinCode; this.loading = false; this.changeDetector.markForCheck(); },
      error: () => { this.errorMessage = 'Could not load the game.'; this.loading = false; this.changeDetector.markForCheck(); },
    });
  }

  async startGame(): Promise<void> {
    if (this.starting() || !this.game.synchronized()) return;
    this.starting.set(true);
    this.actionError.set('');
    try {
      await this.game.startGame(this.gameId);
      if (!this.destroyRef.destroyed) await this.router.navigate(['/host', this.gameId]);
    } catch (error) {
      this.actionError.set(error instanceof Error ? error.message : 'Could not start the game.');
    } finally { this.starting.set(false); }
  }
}
