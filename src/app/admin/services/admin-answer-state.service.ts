import { Injectable } from '@angular/core';
import { Clue } from '../../models/clue';
import { SubmittedAnswer } from '../models/submitted-answer';

@Injectable({
  providedIn: 'root',
})
export class AdminAnswerStateService {
  private selectedClue?: Clue;
  private submittedAnswers: SubmittedAnswer[] = [];

  setSelectedClue(clue: Clue): void {
    this.selectedClue = clue;
    this.submittedAnswers = [];
  }

  getSelectedClue(): Clue | undefined {
    return this.selectedClue;
  }

  clearSelectedClue(): void {
    this.selectedClue = undefined;
    this.submittedAnswers = [];
  }

  addSubmittedAnswer(answer: SubmittedAnswer): void {
    if (this.selectedClue && answer.clueId !== this.selectedClue.id) {
      return;
    }

    const isCorrect =
      answer.isCorrect ?? this.evaluateAnswer(answer.submittedAnswer, this.selectedClue?.correctAnswer);

    this.submittedAnswers = [...this.submittedAnswers, { ...answer, isCorrect }];
  }

  getSubmittedAnswers(): SubmittedAnswer[] {
    return this.submittedAnswers;
  }

  updateAnswerCorrectness(answerToUpdate: SubmittedAnswer, isCorrect: boolean): void {
    this.submittedAnswers = this.submittedAnswers.map(answer =>
      this.isSameAnswer(answer, answerToUpdate) ? { ...answer, isCorrect } : answer
    );
  }

  private evaluateAnswer(submittedAnswer: string, correctAnswer?: string): boolean | null {
    if (!correctAnswer) {
      return null;
    }

    return this.normalizeAnswer(submittedAnswer) === this.normalizeAnswer(correctAnswer);
  }

  private normalizeAnswer(answer: string): string {
    return answer.trim().toLowerCase().replace(/^what is\s+/, '').replace(/^who is\s+/, '');
  }

  private isSameAnswer(left: SubmittedAnswer, right: SubmittedAnswer): boolean {
    return (
      left.clueId === right.clueId &&
      left.playerId === right.playerId &&
      left.submittedAnswer === right.submittedAnswer &&
      left.responseTimeMs === right.responseTimeMs
    );
  }
}
