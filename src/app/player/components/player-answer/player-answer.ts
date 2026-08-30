import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlayerClueStateService } from '../../services/player-clue-state.service';
import { PlayerService } from '../../services/player-api';
import { PlayerSessionService } from '../../services/player-session.service';
import { AdminAnswerStateService } from '../../../admin/services/admin-answer-state.service';
import { SocketService } from '../../../core/services/socket/socker.service';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-player-answer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './player-answer.html',
  styleUrl: './player-answer.scss',
})
export class PlayerAnswerComponent implements OnInit, OnDestroy {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly playerClueStateService = inject(PlayerClueStateService);
  private readonly playerService = inject(PlayerService);
  private readonly playerSessionService = inject(PlayerSessionService);
  private readonly adminAnswerStateService = inject(AdminAnswerStateService);
  private readonly socketService = inject(SocketService);
  private readonly router = inject(Router);
  private readonly gameId = environment.gameId;

  answer = '';
  submitted = false;
  errorMessage = '';
  submitting = false;

  ngOnInit(): void {
    console.log('[PlayerAnswerComponent] ngOnInit', { gameId: this.gameId });
    this.socketService.joinPlayerGame(this.gameId);
    this.socketService.onClueSelected(clue => {
      console.log('[PlayerAnswerComponent] received selected clue', { clue });
      this.playerClueStateService.setSelectedClue(clue);
      this.answer = '';
      this.submitted = false;
      this.errorMessage = '';
      this.submitting = false;
      this.changeDetectorRef.detectChanges();
    });
    this.socketService.onClueClosed(() => {
      console.log('[PlayerAnswerComponent] received clue closed, navigating to /player-board');
      this.playerClueStateService.clearSelectedClue();
      this.answer = '';
      this.submitted = false;
      this.errorMessage = '';
      this.submitting = false;
      this.changeDetectorRef.detectChanges();
      void this.router.navigate(['/player-board']);
    });

    if (!this.playerSessionService.getPlayerId()) {
      this.errorMessage = 'Could not find your player session. Please rejoin the game.';
    } else if (!this.playerClueStateService.hasSelectedClue()) {
      this.errorMessage = 'Waiting for the current question. Please stay on this screen.';
    }
  }

  ngOnDestroy(): void {
    this.socketService.offClueSelected();
    this.socketService.offClueClosed();
  }

  get question(): string {
    return this.playerClueStateService.getSelectedClue()?.question ?? '';
  }

  get canSubmit(): boolean {
    return !this.submitted && !this.submitting && !!this.answer.trim() && this.playerClueStateService.hasSelectedClue();
  }

  submitAnswer(): void {
    if (!this.answer.trim()) {
      return;
    }

    const clueId = this.playerClueStateService.getSelectedClue()?.id;
    const playerId = this.playerSessionService.getPlayerId();

    if (!clueId || !playerId) {
      this.errorMessage = 'Could not submit your answer. Please rejoin the game.';
      return;
    }

    this.errorMessage = '';
    this.submitting = true;

    const request = {
      clueId,
      playerId,
      submittedAnswer: this.answer.trim(),
      responseTimeMs: Date.now() - this.playerClueStateService.getQuestionShownAt(),
    };

    this.playerService.submitAnswer(request).subscribe({
      next: () => {
        this.submitted = true;
        this.submitting = false;
        const player = this.playerSessionService.getPlayer();
        const submittedAnswer = {
          ...request,
          playerName: player?.name,
          isCorrect: null,
        };
        this.adminAnswerStateService.addSubmittedAnswer(submittedAnswer);
        this.socketService.submitAnswer(this.gameId, submittedAnswer);
        this.changeDetectorRef.detectChanges();
        console.log('[PlayerAnswerComponent] answer submitted', request);
      },
      error: error => {
        this.submitting = false;
        this.errorMessage = 'Could not submit your answer. Please try again.';
        this.changeDetectorRef.detectChanges();
        console.log('[PlayerAnswerComponent] answer submit error', { error, request });
      },
    });
  }
}
