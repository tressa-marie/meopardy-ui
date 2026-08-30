import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AdminAnswerStateService } from '../../services/admin-answer-state.service';
import { SubmittedAnswer } from '../../models/submitted-answer';
import { Clue } from '../../../models/clue';
import { SocketService } from '../../../core/services/socket/socker.service';
import { environment } from '../../../../environments/environment';
import { Player } from '../../../models/player';
import { PlayerService } from '../../../player/services/player-api';
import { Subject, timer } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { ThemeName, ThemeService } from '../../../core/services/theme/theme.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-answer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-answer-dashboard.html',
  styleUrl: './admin-answer-dashboard.scss',
})
export class AdminAnswerDashboardComponent implements OnInit, OnDestroy {
  private readonly adminAnswerStateService = inject(AdminAnswerStateService);
  private readonly socketService = inject(SocketService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly playerService = inject(PlayerService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly gameId = environment.gameId;
  private readonly destroy$ = new Subject<void>();

  selectedClue?: Clue;
  submittedAnswers: SubmittedAnswer[] = [];
  players: Player[] = [];
  readonly themes = this.themeService.getThemes();
  selectedTheme: ThemeName = this.themeService.getSavedTheme();

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

  onThemeChange(theme: ThemeName): void {
    this.selectedTheme = theme;
    this.themeService.setTheme(theme);
    this.socketService.setTheme(this.gameId, theme);
    void this.router.navigate([], {
      queryParams: { theme },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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
