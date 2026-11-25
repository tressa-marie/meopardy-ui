import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { GameSettingsComponent } from './game-settings';
import { SocketService } from '../../../core/services/socket/socker.service';
import { ThemeService } from '../../../core/services/theme/theme.service';
import { gameStub, makeState } from '../../../testing/game-fixtures';

describe('Shared game settings', () => {
  let game: ReturnType<typeof gameStub>;
  let fixture: ComponentFixture<GameSettingsComponent>;
  let component: GameSettingsComponent;
  let applyTheme: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    game = gameStub(makeState({ status: 'setup', theme: 'classic' }));
    applyTheme = vi.fn();
    TestBed.configureTestingModule({ imports: [GameSettingsComponent], providers: [
      provideRouter([]), { provide: SocketService, useValue: game },
      { provide: ThemeService, useValue: {
        getThemes: () => ['classic', 'pastel-holiday'], getSavedTheme: () => 'classic',
        isThemeName: (theme: string) => theme === 'classic' || theme === 'pastel-holiday',
        setTheme: applyTheme,
      } },
    ] });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(GameSettingsComponent);
    fixture.componentRef.setInput('gameId', 8);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('restores the theme saved for this game when its snapshot arrives', async () => {
    game.state.set(makeState({ status: 'setup', theme: 'pastel-holiday' }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.selectedTheme()).toBe('pastel-holiday');
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    expect(select.selectedOptions[0].textContent?.trim()).toBe('pastel-holiday');
  });

  it('saves the theme before applying it locally and updating the page URL', async () => {
    let confirm!: () => void;
    game.setTheme.mockImplementation(() => new Promise<void>(resolve => { confirm = resolve; }));
    const busy = vi.fn();
    component.busyChange.subscribe(busy);
    const saving = component.onThemeChange('pastel-holiday');
    await component.onThemeChange('classic');
    fixture.detectChanges();
    expect(game.setTheme).toHaveBeenCalledExactlyOnceWith(8, 'pastel-holiday');
    expect(fixture.nativeElement.querySelector('select').disabled).toBe(true);
    expect(applyTheme).not.toHaveBeenCalled();
    game.state.set(makeState({ status: 'setup', theme: 'pastel-holiday' }));
    confirm();
    await saving;
    expect(applyTheme).toHaveBeenCalledWith('pastel-holiday');
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: { theme: 'pastel-holiday' }, queryParamsHandling: 'merge', replaceUrl: true,
    }));
    expect(busy.mock.calls).toEqual([[true], [false]]);
    expect(component.changingTheme()).toBe(false);
  });

  it('restores the picker and shows an error if saving fails', async () => {
    game.setTheme.mockRejectedValue(new Error('Save failed'));
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    select.value = select.options[1].value;
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(component.selectedTheme()).toBe('classic');
    expect(select.selectedOptions[0].textContent?.trim()).toBe('classic');
    expect(select.disabled).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Could not change the theme');
    expect(applyTheme).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('blocks changes while disconnected or while its parent is starting the game', async () => {
    game.synchronized.set(false);
    await component.onThemeChange('pastel-holiday');
    expect(game.setTheme).not.toHaveBeenCalled();
    game.synchronized.set(true);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    await component.onThemeChange('pastel-holiday');
    expect(fixture.nativeElement.querySelector('select').disabled).toBe(true);
    expect(game.setTheme).not.toHaveBeenCalled();
  });
});
