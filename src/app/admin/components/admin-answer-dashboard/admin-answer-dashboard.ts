import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AdminAnswerStateService } from '../../services/admin-answer-state.service';
import { SubmittedAnswer } from '../../models/submitted-answer';
import { Clue } from '../../../models/clue';
import { SocketService } from '../../../core/services/socket/socker.service';
import { environment } from '../../../../environments/enironment';

@Component({
  selector: 'app-admin-answer-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-answer-dashboard.html',
  styleUrl: './admin-answer-dashboard.scss',
})
export class AdminAnswerDashboardComponent implements OnInit, OnDestroy {
  private readonly adminAnswerStateService = inject(AdminAnswerStateService);
  private readonly socketService = inject(SocketService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly gameId = environment.gameId;

  selectedClue?: Clue;
  submittedAnswers: SubmittedAnswer[] = [];

  ngOnInit(): void {
    console.log('[AdminAnswerDashboardComponent] ngOnInit', { gameId: this.gameId });
    this.refreshView();
    this.socketService.joinGame(this.gameId);
    this.socketService.onClueSelected(clue => {
      console.log('[AdminAnswerDashboardComponent] received selected clue', { clue });
      this.adminAnswerStateService.setSelectedClue(clue);
      this.refreshView();
    });
    this.socketService.onClueClosed(() => {
      console.log('[AdminAnswerDashboardComponent] received clue closed');
      this.adminAnswerStateService.clearSelectedClue();
      this.refreshView();
    });
    this.socketService.onAnswerSubmitted(answer => {
      console.log('[AdminAnswerDashboardComponent] received submitted answer', { answer });
      this.adminAnswerStateService.addSubmittedAnswer(answer);
      this.refreshView();
    });
  }

  ngOnDestroy(): void {
    console.log('[AdminAnswerDashboardComponent] ngOnDestroy');
    this.socketService.offClueSelected();
    this.socketService.offClueClosed();
    this.socketService.offAnswerSubmitted();
  }

  setAnswerCorrectness(answer: SubmittedAnswer, isCorrect: boolean): void {
    this.adminAnswerStateService.updateAnswerCorrectness(answer, isCorrect);
    this.refreshView();
  }

  private refreshView(): void {
    this.selectedClue = this.adminAnswerStateService.getSelectedClue();
    this.submittedAnswers = this.adminAnswerStateService.getSubmittedAnswers();
    this.changeDetectorRef.detectChanges();
  }
}
