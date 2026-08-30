import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerJoinComponent } from './player-join';

describe('PlayerJoinComponent', () => {
  let component: PlayerJoinComponent;
  let fixture: ComponentFixture<PlayerJoinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerJoinComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerJoinComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
