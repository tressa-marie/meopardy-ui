import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  joinCode = '';
  loading = true;
  errorMessage = '';
  private readonly gameService = inject(GameService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.game.joinGame(this.gameId);
    this.gameService.getJoinCode(this.gameId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: joinCode => { this.joinCode = joinCode; this.loading = false; this.changeDetector.markForCheck(); },
      error: () => { this.errorMessage = 'Could not load the game.'; this.loading = false; this.changeDetector.markForCheck(); },
    });
  }
}
