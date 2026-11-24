import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { GameService } from '../../services/game-api';
import { QuizImportResponse, QuizIssue } from '../../models/quiz-import';
import { loadQuizFile, QuizValidation } from '../../services/quiz-file';
import { quizImportError } from '../../services/quiz-import-error';

@Component({
  selector: 'app-upload-quiz', standalone: true, imports: [RouterLink],
  templateUrl: './upload-quiz.html', styleUrl: './upload-quiz.scss',
})
export class UploadQuizComponent {
  private readonly gameService = inject(GameService);
  private readonly destroyRef = inject(DestroyRef);
  private selectionVersion = 0;
  readonly selection = signal<Extract<QuizValidation, { valid: true }> | null>(null);
  readonly filename = signal('');
  readonly reading = signal(false);
  readonly importing = signal(false);
  readonly result = signal<QuizImportResponse | null>(null);
  readonly errorMessage = signal('');
  readonly issues = signal<QuizIssue[]>([]);
  readonly visibleIssues = computed(() => this.issues().slice(0, 50));
  readonly uncertainOutcome = signal(false);
  readonly canImport = computed(() => !!this.selection() && !this.reading() && !this.importing() && !this.result());

  constructor() { this.destroyRef.onDestroy(() => this.selectionVersion++); }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    input.value = '';
    if (file) void this.selectFile(file);
  }

  async selectFile(file: File): Promise<void> {
    if (this.importing()) return;
    const version = ++this.selectionVersion;
    this.selection.set(null);
    this.result.set(null);
    this.filename.set(file.name);
    this.errorMessage.set('');
    this.issues.set([]);
    this.uncertainOutcome.set(false);
    this.reading.set(true);
    try {
      const validation = await loadQuizFile(file);
      if (version !== this.selectionVersion) return;
      if (validation.valid) this.selection.set(validation);
      else {
        this.errorMessage.set('This quiz needs a few fixes before it can be imported.');
        this.issues.set(validation.issues);
      }
    } catch (error) {
      if (version === this.selectionVersion) {
        this.errorMessage.set(error instanceof Error ? error.message : 'Could not read the quiz file.');
      }
    } finally {
      if (version === this.selectionVersion) this.reading.set(false);
    }
  }

  importQuiz(): void {
    if (!this.canImport()) return;
    const selection = this.selection()!;
    this.importing.set(true);
    this.errorMessage.set('');
    this.issues.set([]);
    this.uncertainOutcome.set(false);
    this.gameService.importQuiz(selection.quiz).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.importing.set(false))
    ).subscribe({
      next: result => this.result.set(result),
      error: error => {
        const failure = quizImportError(error);
        this.errorMessage.set(failure.message);
        this.issues.set(failure.issues);
        this.uncertainOutcome.set(failure.uncertain);
      },
    });
  }

  reset(): void {
    if (this.importing()) return;
    this.selectionVersion++;
    this.selection.set(null);
    this.result.set(null);
    this.filename.set('');
    this.reading.set(false);
    this.errorMessage.set('');
    this.issues.set([]);
    this.uncertainOutcome.set(false);
  }
}
