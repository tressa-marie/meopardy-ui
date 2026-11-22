import { Component, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { bindPlayerGame } from '../../services/player-game';

@Component({
  selector: 'app-player-answer', standalone: true, imports: [FormsModule, RouterLink],
  templateUrl: './player-answer.html', styleUrl: './player-answer.scss',
})
export class PlayerAnswerComponent {
  readonly game = bindPlayerGame();
  answer = '';
  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  private readonly acceptedClueId = signal<number | null>(null);
  readonly submitted = computed(() => {
    const id = this.game.activeClue()?.id;
    return !!id && (this.acceptedClueId() === id || this.game.ownAnswer()?.clueId === id);
  });
  private currentClueId?: number;

  constructor() {
    effect(() => {
      const id = this.game.activeClue()?.id;
      if (id === this.currentClueId) return;
      this.currentClueId = id;
      this.answer = '';
      this.errorMessage.set('');
      this.acceptedClueId.set(null);
      this.submitting.set(false);
    });
  }

  get question(): string { return this.game.activeClue()?.question ?? ''; }

  get canSubmit(): boolean {
    return this.game.acceptingAnswers() && !this.submitted() && !this.submitting() && !!this.answer.trim();
  }

  async submitAnswer(): Promise<void> {
    if (!this.canSubmit) return;
    const clueId = this.game.activeClue()!.id;
    this.submitting.set(true);
    this.errorMessage.set('');
    try {
      await this.game.submitAnswer(clueId, this.answer.trim());
      if (this.game.activeClue()?.id === clueId) this.acceptedClueId.set(clueId);
    } catch (error) {
      if (this.game.activeClue()?.id === clueId) {
        this.errorMessage.set(error instanceof Error ? error.message : 'Could not submit your answer. Please retry.');
      }
      // A timed-out acknowledgment may still have saved the answer. Recover before another attempt.
      await this.game.sync().catch(() => undefined);
    } finally {
      if (this.game.activeClue()?.id === clueId) this.submitting.set(false);
    }
  }
}
