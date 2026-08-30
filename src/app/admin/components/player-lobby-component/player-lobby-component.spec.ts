import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { PlayerLobbyComponent } from './player-lobby-component';

describe('PlayerLobbyComponent', () => {
  let component: PlayerLobbyComponent;
  let fixture: ComponentFixture<PlayerLobbyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerLobbyComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ gameId: '8' }) } },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerLobbyComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('takes the game id from the route', () => {
    expect(component.gameId).toBe(8);
  });
});
