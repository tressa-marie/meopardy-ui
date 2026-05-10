import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostGame } from './host-game';

describe('HostGame', () => {
  let component: HostGame;
  let fixture: ComponentFixture<HostGame>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostGame]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostGame);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
