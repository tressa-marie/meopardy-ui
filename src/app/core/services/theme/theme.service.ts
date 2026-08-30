import { Injectable } from '@angular/core';

export type ThemeName = 'classic' | 'pastel-holiday';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly storageKey = 'meopardy-theme';
  private readonly defaultTheme: ThemeName = 'classic';

  constructor() {
    this.applyTheme(this.getSavedTheme());
  }

  getThemes(): ThemeName[] {
    return ['classic', 'pastel-holiday'];
  }

  isThemeName(value: string | null): value is ThemeName {
    return value === 'classic' || value === 'pastel-holiday';
  }

  getSavedTheme(): ThemeName {
    if (!this.hasStorage()) {
      return this.defaultTheme;
    }

    const savedTheme = localStorage.getItem(this.storageKey);
    return this.isThemeName(savedTheme) ? savedTheme : this.defaultTheme;
  }

  setTheme(theme: ThemeName): void {
    if (this.hasStorage()) {
      localStorage.setItem(this.storageKey, theme);
    }

    this.applyTheme(theme);
  }

  private applyTheme(theme: ThemeName): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.setAttribute('data-theme', theme);
  }

  private hasStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }
}
