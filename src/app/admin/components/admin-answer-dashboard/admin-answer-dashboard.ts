import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SubmittedAnswer } from '../../models/submitted-answer';
import { SocketService } from '../../../core/services/socket/socker.service';
import { injectRouteGameId } from '../../../core/routing/game-id';
import { PlayerService } from '../../../player/services/player-api';
import { GameSettingsComponent } from '../game-settings/game-settings';

@Component({
  selector: 'app-admin-answer-dashboard', standalone: true, imports: [GameSettingsComponent, RouterLink],
  templateUrl: './admin-answer-dashboard.html', styleUrl: './admin-answer-dashboard.scss',
})
export class AdminAnswerDashboardComponent {
  readonly game = inject(SocketService);
  readonly gameId = injectRouteGameId();
  private readonly playerService = inject(PlayerService);
  readonly gradingIds = signal<Set<number>>(new Set());
  readonly errorMessage = signal('');
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

}
