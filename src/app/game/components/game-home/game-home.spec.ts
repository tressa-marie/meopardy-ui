import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { GameHomeComponent } from './game-home';
import { UploadQuizComponent } from '../upload-quiz/upload-quiz';
import { routes } from '../../../app.routes';

describe('Game-independent entry routes', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [
    provideRouter(routes), provideHttpClient(), provideHttpClientTesting(),
  ] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('opens the home page with prominent upload and join links without loading a default game', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/', GameHomeComponent);
    const links = [...harness.routeNativeElement!.querySelectorAll<HTMLAnchorElement>('.entry-button')];
    expect(links.map(link => link.getAttribute('href'))).toEqual(['/upload-quiz', '/join']);
    expect(links.map(link => link.textContent)).toEqual(['Upload Quiz', 'Join Game']);
    TestBed.inject(HttpTestingController).expectNone(() => true);
  });

  it('opens the upload page directly without any game ID', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/upload-quiz', UploadQuizComponent);
    expect(harness.routeNativeElement!.querySelector('h1')!.textContent).toBe('Upload Quiz');
    TestBed.inject(HttpTestingController).expectNone(() => true);
  });

  it('preserves the existing host and player route paths', () => {
    expect(routes.map(route => route.path)).toEqual(expect.arrayContaining([
      'admin-lobby/:gameId', 'admin-dashboard/:gameId', 'host/:gameId', 'join-code/:gameId',
      'join', 'join-confirmation', 'player-board', 'player-answer',
    ]));
  });
});
