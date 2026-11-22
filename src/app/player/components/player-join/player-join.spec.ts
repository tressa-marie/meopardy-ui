import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PlayerJoinComponent } from './player-join';

describe('PlayerJoinComponent', () => {
  it('requires a join code before making a request', () => {
    TestBed.configureTestingModule({ imports: [PlayerJoinComponent], providers: [
      provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
    ] });
    const component = TestBed.createComponent(PlayerJoinComponent).componentInstance;
    component.joinGame();
    expect(component.errorMessage).toBe('Enter the 6-character join code.');
    expect(component.loading).toBe(false);
  });
});
