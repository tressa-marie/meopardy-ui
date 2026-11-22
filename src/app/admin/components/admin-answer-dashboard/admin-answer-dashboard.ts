import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SubmittedAnswer } from '../../models/submitted-answer';
import { SocketService } from '../../../core/services/socket/socker.service';
import { injectRouteGameId } from '../../../core/routing/game-id';
import { PlayerService } from '../../../player/services/player-api';
import { ThemeName, ThemeService } from '../../../core/services/theme/theme.service';

@Component({
  selector: 'app-admin-answer-dashboard', standalone: true, imports: [FormsModule, RouterLink],
  templateUrl: './admin-answer-dashboard.html', styleUrl: './admin-answer-dashboard.scss',
})
export class AdminAnswerDashboardComponent {
  readonly game = inject(SocketService);
  readonly gameId = injectRouteGameId();
  private readonly playerService = inject(PlayerService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  readonly themes = this.themeService.getThemes();
  readonly selectedTheme = signal(this.themeService.getSavedTheme());
  readonly gradingIds = signal<Set<number>>(new Set());
  readonly errorMessage = signal('');
  readonly changingTheme = signal(false);
  readonly sortedPlayers = computed(() => [...(this.game.state()?.players ?? [])]
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name)));

  constructor() { this.game.joinGame(this.gameId); }
  get selectedClue() { return this.game.activeClue(); }
  get submittedAnswers() { return this.game.answers(); }
  get players() { return this.sortedPlayers(); }

  async setAnswerCorrectness(answer: SubmittedAnswer, isCorrect: boolean): Promise<void> {
    if (this.gradingIds().has(answer.id) || !this.game.synchronized()) return;
    this.gradingIds.update(ids => new Set([...ids, answer.id]));
    this.errorMessage.set('');
    try {
      await firstValueFrom(this.playerService.overrideAnswer(answer.id, isCorrect));
      // The server persists the judgment and score delta, then broadcasts both.
      await this.game.sync();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Could not save the judgment. Please retry.');
    } finally {
      this.gradingIds.update(ids => { const next = new Set(ids); next.delete(answer.id); return next; });
    }
  }

  async onThemeChange(theme: ThemeName): Promise<void> {
    if (this.changingTheme() || !this.game.synchronized()) return;
    this.changingTheme.set(true);
    this.errorMessage.set('');
    try {
      await this.game.setTheme(this.gameId, theme);
      this.selectedTheme.set(theme);
      this.themeService.setTheme(theme);
      await this.router.navigate([], {
        relativeTo: this.activatedRoute, queryParams: { theme },
        queryParamsHandling: 'merge', replaceUrl: true,
      });
    } catch {
      this.errorMessage.set('Could not change the theme. Please retry.');
    } finally { this.changingTheme.set(false); }
  }
}
