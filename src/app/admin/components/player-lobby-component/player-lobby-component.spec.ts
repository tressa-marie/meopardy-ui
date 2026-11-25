import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { PlayerLobbyComponent } from './player-lobby-component';
import { SocketService } from '../../../core/services/socket/socker.service';
import { gameStub, makeState } from '../../../testing/game-fixtures';
import { GameSettingsComponent } from '../game-settings/game-settings';

describe('PlayerLobby start confirmation', () => {
  let game: ReturnType<typeof gameStub>;
  let component: PlayerLobbyComponent;
  let fixture: ComponentFixture<PlayerLobbyComponent>;
  let navigate: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    game = gameStub(makeState({ status: 'setup' }));
    TestBed.configureTestingModule({ imports: [PlayerLobbyComponent], providers: [
      provideRouter([]), { provide: SocketService, useValue: game },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ gameId: '8' }) } } },
    ] });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(PlayerLobbyComponent);
    component = fixture.componentInstance;
  });

  it('waits for confirmation and prevents a second start while pending', async () => {
    let confirm!: () => void;
    game.startGame.mockImplementation(() => new Promise<void>(resolve => confirm = resolve));
    const pending = component.startGame();
    await component.startGame();
    // A state broadcast may arrive before the start acknowledgment.
    game.state.set(makeState({ status: 'board' }));
    fixture.detectChanges();
    expect(navigate).not.toHaveBeenCalled();
    expect(game.startGame).toHaveBeenCalledOnce();
    confirm();
    await pending;
    expect(navigate).toHaveBeenCalledWith(['/admin-dashboard', 8]);
  });

  it('stays in the lobby when the server rejects starting', async () => {
    game.startGame.mockRejectedValue(new Error('No playable rounds'));
    await component.startGame();
    expect(navigate).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe('No playable rounds');
  });

  it('renders Settings before starting and removes the Show join code link', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-game-settings h2').textContent).toBe('Settings');
    expect(fixture.nativeElement.querySelector('app-game-settings select')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Show join code');
    expect(fixture.nativeElement.querySelector('a[href^="/join-code"]')).toBeNull();
  });

  it('waits for a pending theme change before allowing Start Game', async () => {
    fixture.detectChanges();
    const settings: GameSettingsComponent = fixture.debugElement.query(By.directive(GameSettingsComponent)).componentInstance;
    let confirm!: () => void;
    game.setTheme.mockImplementation(() => new Promise<void>(resolve => { confirm = resolve; }));
    const saving = settings.onThemeChange('pastel-holiday');
    fixture.detectChanges();
    expect(component.changingTheme()).toBe(true);
    expect(fixture.nativeElement.querySelector('.start-button').disabled).toBe(true);
    await component.startGame();
    expect(game.startGame).not.toHaveBeenCalled();
    confirm();
    await saving;
    fixture.detectChanges();
    expect(component.changingTheme()).toBe(false);
    expect(fixture.nativeElement.querySelector('.start-button').disabled).toBe(false);
  });
});
