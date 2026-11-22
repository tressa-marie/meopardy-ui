import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PlayerService } from './player-api';
import { environment } from '../../../environments/environment';

describe('PlayerService persisted judgments', () => {
  let service: PlayerService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PlayerService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('saves a judgment against the stable server answer ID', () => {
    const received = vi.fn();
    service.overrideAnswer(12, true).subscribe(received);
    const request = http.expectOne(environment.apiUrl + '/answers/12/override');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ isCorrect: true });
    request.flush({ answerId: 12, playerId: 2, isCorrect: true, pointsAwarded: 200, newScore: 200 });
    expect(received).toHaveBeenCalledWith(expect.objectContaining({ newScore: 200 }));
  });
});
