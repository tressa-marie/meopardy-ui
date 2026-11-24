import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GameService, QUIZ_IMPORT_TIMEOUT_MS } from './game-api';
import { environment } from '../../../environments/environment';
import { quizFixture } from '../../testing/quiz-fixtures';
import { UnexpectedQuizImportResponseError } from '../models/quiz-import';

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

describe('GameService quiz import', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.useRealTimers();
  });

  it('posts the quiz object directly as JSON, preserving explicit timer values', () => {
    const quiz = quizFixture();
    const received = vi.fn();
    TestBed.inject(GameService).importQuiz(quiz).subscribe(received);
    const request = TestBed.inject(HttpTestingController).expectOne(environment.apiUrl + '/games/import');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Content-Type')).toBe('application/json');
    expect(request.request.body).toBe(quiz);
    expect(request.request.body).not.toBeInstanceOf(FormData);
    expect(request.request.body.rounds[0].categories[0].clues[0].timeLimitSeconds).toBe(40);
    request.flush({ message: 'Game imported successfully', gameId: 417, joinCode: 'ABC123' }, { status: 201, statusText: 'Created' });
    expect(received).toHaveBeenCalledWith(expect.objectContaining({ gameId: 417 }));
  });

  it.each([null, {}, { gameId: 0, joinCode: 'ABC123', message: 'OK' },
    { gameId: '1', joinCode: 'ABC123', message: 'OK' }, { gameId: 1, joinCode: ' ', message: 'OK' },
  ])('rejects an unexpected success response: %j', response => {
    const failure = vi.fn();
    TestBed.inject(GameService).importQuiz(quizFixture()).subscribe({ error: failure });
    TestBed.inject(HttpTestingController).expectOne(environment.apiUrl + '/games/import').flush(response);
    expect(failure).toHaveBeenCalledWith(expect.any(UnexpectedQuizImportResponseError));
  });

  it('allows 120 seconds and times out without retrying the POST', () => {
    vi.useFakeTimers();
    const failure = vi.fn();
    TestBed.inject(GameService).importQuiz(quizFixture()).subscribe({ error: failure });
    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne(environment.apiUrl + '/games/import');
    vi.advanceTimersByTime(QUIZ_IMPORT_TIMEOUT_MS - 1);
    expect(failure).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(failure).toHaveBeenCalledWith(expect.objectContaining({ name: 'TimeoutError' }));
    expect(request.cancelled).toBe(true);
    vi.advanceTimersByTime(QUIZ_IMPORT_TIMEOUT_MS);
    http.expectNone(environment.apiUrl + '/games/import');
  });

  it('does not retry server failures', () => {
    const failure = vi.fn();
    TestBed.inject(GameService).importQuiz(quizFixture()).subscribe({ error: failure });
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(environment.apiUrl + '/games/import').flush({ message: 'Import failed' }, { status: 500, statusText: 'Server error' });
    expect(failure).toHaveBeenCalledOnce();
    http.expectNone(environment.apiUrl + '/games/import');
  });
});
