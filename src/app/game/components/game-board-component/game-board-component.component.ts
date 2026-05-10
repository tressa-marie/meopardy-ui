import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameBoard } from '../../../models/board';
import { Clue } from '../../../models/clue';
import { GameService } from '../../services/game/game-api';

@Component({
  selector: 'app-game-board-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-board-component.component.html',
  styleUrl: './game-board-component.component.scss'
})

export class GameBoardComponentComponent implements OnInit {
  board?: GameBoard;
  selectedClue?: Clue;
  loading = true;
  errorMessage = '';

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    this.gameService.getGameBoard(8).subscribe({
      next: board => {
        this.board = board;
        this.loading = false;
        console.log('board', board);
      },
      error: () => {
        this.errorMessage = 'Could not load the game board.';
        this.loading = false;
      }
    });
  }

  selectClue(clue: Clue): void {
    if (clue.isAnswered) return;
    this.selectedClue = clue;
  }

  closeClue(): void {
    this.selectedClue = undefined;
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
