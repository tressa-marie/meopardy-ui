import { Injectable } from '@angular/core';
import { Clue } from '../../models/clue';

@Injectable({
  providedIn: 'root',
})
export class PlayerClueStateService {
  private readonly clueStorageKey = 'meopardy-selected-clue';
  private readonly shownAtStorageKey = 'meopardy-selected-clue-shown-at';
  private selectedClue?: Clue;
  private questionShownAt?: number;

  setSelectedClue(clue: Clue): void {
    this.selectedClue = clue;
    this.questionShownAt = Date.now();
    localStorage.setItem(this.clueStorageKey, JSON.stringify(clue));
    localStorage.setItem(this.shownAtStorageKey, this.questionShownAt.toString());
  }

  getSelectedClue(): Clue | undefined {
    if (this.selectedClue) {
      return this.selectedClue;
    }

    const rawClue = localStorage.getItem(this.clueStorageKey);
    if (!rawClue) {
      return undefined;
    }

    try {
      this.selectedClue = JSON.parse(rawClue) as Clue;
      return this.selectedClue;
    } catch {
      localStorage.removeItem(this.clueStorageKey);
      return undefined;
    }
  }

  getQuestionShownAt(): number {
    if (this.questionShownAt) {
      return this.questionShownAt;
    }

    const rawShownAt = localStorage.getItem(this.shownAtStorageKey);
    const shownAt = rawShownAt ? Number(rawShownAt) : NaN;

    if (Number.isFinite(shownAt) && shownAt > 0) {
      this.questionShownAt = shownAt;
      return shownAt;
    }

    const fallback = Date.now();
    this.questionShownAt = fallback;
    localStorage.setItem(this.shownAtStorageKey, fallback.toString());
    return fallback;
  }

  hasSelectedClue(): boolean {
    return !!this.getSelectedClue();
  }

  clearSelectedClue(): void {
    this.selectedClue = undefined;
    this.questionShownAt = undefined;
    localStorage.removeItem(this.clueStorageKey);
    localStorage.removeItem(this.shownAtStorageKey);
  }
}
