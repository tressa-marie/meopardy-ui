import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerJoin } from './player-join';

describe('PlayerJoin', () => {
  let component: PlayerJoin;
  let fixture: ComponentFixture<PlayerJoin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerJoin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerJoin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
