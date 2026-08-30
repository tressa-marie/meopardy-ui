import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PlayerJoinConfirmationComponent } from './player-join-confirmation';
import { PlayerSessionService } from '../../services/player-session.service';

describe('PlayerJoinConfirmationComponent', () => {
  let component: PlayerJoinConfirmationComponent;
  let fixture: ComponentFixture<PlayerJoinConfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerJoinConfirmationComponent],
      providers: [
        provideRouter([{ path: 'join', children: [] }]),
        {
          provide: PlayerSessionService,
          useValue: { getGameId: () => 8 },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerJoinConfirmationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('takes the game id from the joined player session', () => {
    expect(component['gameId']).toBe(8);
  });
});
