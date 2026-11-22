import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GameService } from './game-api';
import { environment } from '../../../environments/environment';

describe('GameService join code contracts', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  for (const response of ['ABC123', { joinCode: 'ABC123' }]) {
    it('reads the join code from ' + JSON.stringify(response), () => {
      const received = vi.fn();
      TestBed.inject(GameService).getJoinCode(8).subscribe(received);
      TestBed.inject(HttpTestingController).expectOne(environment.apiUrl + '/games/8/join').flush(response);
      expect(received).toHaveBeenCalledWith('ABC123');
    });
  }
});
