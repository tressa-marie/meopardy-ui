import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '../../../core/services/socket/socker.service';
import { ThemeName, ThemeService } from '../../../core/services/theme/theme.service';

@Component({
  selector: 'app-game-settings', standalone: true, imports: [ReactiveFormsModule],
  templateUrl: './game-settings.html', styleUrl: './game-settings.scss',
})
export class GameSettingsComponent {
  readonly gameId = input.required<number>();
  readonly disabled = input(false);
  readonly busyChange = output<boolean>();
  readonly game = inject(SocketService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly themes = this.themeService.getThemes();
  readonly selectedTheme = signal(this.themeService.getSavedTheme());
  readonly themeControl = new FormControl<ThemeName>(this.selectedTheme(), { nonNullable: true });
  readonly changingTheme = signal(false);
  readonly errorMessage = signal('');

  constructor() {
    this.themeControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(theme => {
      void this.onThemeChange(theme);
    });
    effect(() => {
      this.updateControlState();
      const state = this.game.state();
      if (this.changingTheme() || !this.game.synchronized() || !state || state.id !== this.gameId()) return;
      if (this.themeService.isThemeName(state.theme ?? null)) this.selectTheme(state.theme!);
    });
  }

  async onThemeChange(theme: ThemeName): Promise<void> {
    if (this.changingTheme() || this.disabled() || !this.game.synchronized()) return;
    const previousTheme = this.selectedTheme();
    this.changingTheme.set(true);
    this.updateControlState();
    this.busyChange.emit(true);
    this.selectTheme(theme);
    this.errorMessage.set('');
    try {
      await this.game.setTheme(this.gameId(), theme);
      if (this.destroyRef.destroyed) return;
      this.themeService.setTheme(theme);
      await this.router.navigate([], {
        relativeTo: this.activatedRoute, queryParams: { theme },
        queryParamsHandling: 'merge', replaceUrl: true,
      });
    } catch {
      this.selectTheme(previousTheme);
      this.errorMessage.set('Could not change the theme. Please retry.');
    } finally {
      this.changingTheme.set(false);
      this.updateControlState();
      if (!this.destroyRef.destroyed) this.busyChange.emit(false);
    }
  }

  private selectTheme(theme: ThemeName): void {
    this.selectedTheme.set(theme);
    this.themeControl.setValue(theme, { emitEvent: false });
  }

  private updateControlState(): void {
    const disabled = this.changingTheme() || this.disabled() || !this.game.synchronized();
    if (disabled && this.themeControl.enabled) this.themeControl.disable({ emitEvent: false });
    else if (!disabled && this.themeControl.disabled) this.themeControl.enable({ emitEvent: false });
  }
}
