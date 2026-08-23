import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AdminAnswerStateService } from '../../services/admin-answer-state.service';
import { SubmittedAnswer } from '../../models/submitted-answer';
import { Clue } from '../../../models/clue';
import { SocketService } from '../../../core/services/socket/socker.service';
import { environment } from '../../../../environments/enironment';
import { Player } from '../../../models/player';
import { PlayerService } from '../../../player/services/player-api';
import { Subject, timer } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin-answer-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-answer-dashboard.html',
  styleUrl: './admin-answer-dashboard.scss',
  host: {
    ngSkipHydration: 'true',
  },
})
export class AdminAnswerDashboardComponent implements OnInit, OnDestroy {
  private readonly adminAnswerStateService = inject(AdminAnswerStateService);
  private readonly socketService = inject(SocketService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly playerService = inject(PlayerService);
  private readonly gameId = environment.gameId;
  private readonly destroy$ = new Subject<void>();

  selectedClue?: Clue;
  submittedAnswers: SubmittedAnswer[] = [];
  players: Player[] = [];

  ngOnInit(): void {
    console.log('[AdminAnswerDashboardComponent] ngOnInit', { gameId: this.gameId });
    this.refreshView();
    this.loadPlayers();
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
    this.socketService.onPlayersUpdated(players => {
      console.log('[AdminAnswerDashboardComponent] received updated players', { players });
      this.players = this.sortPlayersByScore(players ?? []);
      this.changeDetectorRef.detectChanges();
    });

    timer(3000, 3000)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.playerService.getPlayers(this.gameId))
      )
      .subscribe({
        next: players => {
          console.log('[AdminAnswerDashboardComponent] poll returned players', { count: players.length, players });
          this.players = this.sortPlayersByScore(players);
          this.changeDetectorRef.detectChanges();
        },
        error: error => {
          console.log('[AdminAnswerDashboardComponent] poll players error', { error });
        },
      });
  }

  ngOnDestroy(): void {
    console.log('[AdminAnswerDashboardComponent] ngOnDestroy');
    this.socketService.offClueSelected();
    this.socketService.offClueClosed();
    this.socketService.offAnswerSubmitted();
    this.socketService.offPlayersUpdated();
    this.destroy$.next();
    this.destroy$.complete();
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

  private loadPlayers(): void {
    this.playerService.getPlayers(this.gameId).subscribe({
      next: players => {
        console.log('[AdminAnswerDashboardComponent] loadPlayers success', { count: players.length, players });
        this.players = this.sortPlayersByScore(players);
        this.changeDetectorRef.detectChanges();
      },
      error: error => {
        console.log('[AdminAnswerDashboardComponent] loadPlayers error', { error });
      },
    });
  }

  private sortPlayersByScore(players: Player[]): Player[] {
    return [...players].sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
  }
}
