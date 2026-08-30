import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { GameBoardComponentComponent } from './game-board-component.component';

describe('GameBoardComponentComponent', () => {
  let component: GameBoardComponentComponent;
  let fixture: ComponentFixture<GameBoardComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameBoardComponentComponent],
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

    fixture = TestBed.createComponent(GameBoardComponentComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('takes the game id from the route', () => {
    expect(component['gameId']).toBe(8);
  });
});
