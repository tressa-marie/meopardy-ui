import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameBoard } from '../../../models/board';
import { Clue } from '../../../models/clue';
import { GameService } from '../../services/game-api';
import { injectRouteGameId } from '../../../core/routing/game-id';
import { finalize, timeout } from 'rxjs/operators';
import { SocketService } from '../../../core/services/socket/socker.service';
import { AdminAnswerStateService } from '../../../admin/services/admin-answer-state.service';

@Component({
  selector: 'app-game-board-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-board-component.component.html',
  styleUrl: './game-board-component.component.scss',
})

export class GameBoardComponentComponent implements OnInit {
  private readonly gameId = injectRouteGameId();
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly socketService = inject(SocketService);
  private readonly adminAnswerStateService = inject(AdminAnswerStateService);
  board?: GameBoard;
  selectedClue?: Clue;
  loading = true;
  errorMessage = '';
  private readonly gameService = inject(GameService);

  ngOnInit(): void {
    console.log('[GameBoardComponent] ngOnInit', { gameId: this.gameId });
    this.socketService.joinGame(this.gameId);
    this.gameService.getGameBoard(this.gameId)
      .pipe(
        timeout(10000),
        finalize(() => {
          this.loading = false;
          console.log('[GameBoardComponent] finalize', {
            hasBoard: !!this.board,
            errorMessage: this.errorMessage,
          });
          this.changeDetectorRef.detectChanges();
        })
      )
      .subscribe({
      next: board => {
        this.board = board;
        console.log('[GameBoardComponent] board loaded', board);
      },
      error: error => {
        console.log('[GameBoardComponent] board load error', error);
        this.errorMessage = 'Could not load the game board.';
      },
    });
  }

  selectClue(clue: Clue): void {
    if (clue.isAnswered) return;
    this.selectedClue = clue;
    this.adminAnswerStateService.setSelectedClue(clue);
    this.socketService.selectClue(this.gameId, clue);
  }

  closeClue(): void {
    this.selectedClue = undefined;
    this.adminAnswerStateService.clearSelectedClue();
    this.socketService.closeClue(this.gameId);
  }

  markAnswered(): void {
    if (!this.selectedClue) return;

    this.gameService.markClueAnswered(this.selectedClue.id).subscribe({
      next: () => {
        this.selectedClue!.isAnswered = true;
        this.selectedClue = undefined;
      }
    });
  }
}
