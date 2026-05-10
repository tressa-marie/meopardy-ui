import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerJoinConfirmation } from './player-join-confirmation';

describe('PlayerJoinConfirmation', () => {
  let component: PlayerJoinConfirmation;
  let fixture: ComponentFixture<PlayerJoinConfirmation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerJoinConfirmation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerJoinConfirmation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
