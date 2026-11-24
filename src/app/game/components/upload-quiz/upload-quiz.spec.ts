import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { UploadQuizComponent } from './upload-quiz';
import { environment } from '../../../../environments/environment';
import { quizFile, quizFixture } from '../../../testing/quiz-fixtures';
import { QUIZ_IMPORT_TIMEOUT_MS } from '../../services/game-api';

describe('Upload Quiz flow', () => {
  let fixture: ComponentFixture<UploadQuizComponent>;
  let component: UploadQuizComponent;
  let http: HttpTestingController;
  const url = environment.apiUrl + '/games/import';

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [UploadQuizComponent], providers: [
      provideHttpClient(), provideHttpClientTesting(),
      provideRouter([{ path: 'admin-lobby/:gameId', children: [] }]),
    ] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(UploadQuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  afterEach(() => {
    http.verify();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('reads and previews the quiz without sending a request until Import Quiz is clicked', async () => {
    expect(component.canImport()).toBe(false);
    await component.selectFile(quizFile());
    fixture.detectChanges();
    expect(component.reading()).toBe(false);
    expect(fixture.nativeElement.querySelector('#preview-heading').textContent).toBe('My Quiz');
    expect([...fixture.nativeElement.querySelectorAll('.preview-counts dd')].map((item: unknown) => (item as HTMLElement).textContent)).toEqual(['1', '1', '1']);
    expect(fixture.nativeElement.querySelector('a[download]').getAttribute('href')).toBe('examples/quiz-example.json');
    http.expectNone(url);
    fixture.nativeElement.querySelector('.import-button').click();
    const request = http.expectOne(url);
    expect(request.request.body).toEqual(quizFixture());
    request.flush({ message: 'Game imported successfully', gameId: 417, joinCode: 'ABC123' }, { status: 201, statusText: 'Created' });
  });

  it('disables file selection and submission during import and ignores duplicate clicks or file changes', async () => {
    await component.selectFile(quizFile());
    component.importQuiz();
    component.importQuiz();
    await component.selectFile(quizFile({ ...quizFixture(), title: 'Another quiz' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#quiz-file').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.import-button').disabled).toBe(true);
    expect(component.selection()?.quiz.title).toBe('My Quiz');
    const requests = http.match(url);
    expect(requests).toHaveLength(1);
    requests[0].flush({ message: 'Game imported successfully', gameId: 417, joinCode: 'ABC123' });
    component.importQuiz();
    http.expectNone(url);
  });

  it('shows the returned code and navigates only on Open Host Lobby using the returned game ID', async () => {
    await component.selectFile(quizFile());
    component.importQuiz();
    http.expectOne(url).flush({ message: 'Game imported successfully', gameId: 417, joinCode: 'QWE456' }, { status: 201, statusText: 'Created' });
    fixture.detectChanges();
    expect(component.importing()).toBe(false);
    expect(fixture.nativeElement.querySelector('.join-code').textContent).toBe('QWE456');
    const router = TestBed.inject(Router);
    expect(router.url).toBe('/');
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.host-lobby-link');
    expect(link.getAttribute('href')).toBe('/admin-lobby/417');
    link.click();
    await fixture.whenStable();
    expect(router.url).toBe('/admin-lobby/417');
  });

  it('recovers from invalid JSON and structure errors when a corrected file is selected', async () => {
    await component.selectFile(new File(['{bad'], 'broken.json'));
    expect(component.reading()).toBe(false);
    expect(component.errorMessage()).toContain('not valid JSON');
    expect(component.canImport()).toBe(false);
    const invalid = quizFixture();
    invalid.rounds[0].categories[0].clues[0].correctAnswer = '  ';
    await component.selectFile(quizFile(invalid));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('rounds.0.categories.0.clues.0.correctAnswer');
    expect(fixture.nativeElement.textContent).toContain('indices in these paths start at 0');
    await component.selectFile(quizFile());
    expect(component.errorMessage()).toBe('');
    expect(component.issues()).toEqual([]);
    expect(component.canImport()).toBe(true);
    http.expectNone(url);
  });

  it.each([400, 413, 415, 500])('shows a %s response and unlocks the controls', async status => {
    await component.selectFile(quizFile());
    component.importQuiz();
    http.expectOne(url).flush({ message: `Readable error ${status}`,
      issues: status === 400 ? [{ path: 'rounds.0.categories.0.clues.0.correctAnswer', message: 'Must not be blank' }] : [],
    }, { status, statusText: 'Import error' });
    fixture.detectChanges();
    expect(component.importing()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain(`Readable error ${status}`);
    expect(fixture.nativeElement.querySelector('#quiz-file').disabled).toBe(false);
    expect(fixture.nativeElement.querySelector('.import-button').disabled).toBe(false);
    if (status === 400) {
      expect(fixture.nativeElement.textContent).toContain('rounds.0.categories.0.clues.0.correctAnswer');
      expect(fixture.nativeElement.textContent).toContain('Must not be blank');
    }
    http.expectNone(url);
  });

  it('recovers from network failure and explains that the outcome may be unknown', async () => {
    await component.selectFile(quizFile());
    component.importQuiz();
    http.expectOne(url).error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(component.importing()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Could not reach the game server');
    expect(fixture.nativeElement.textContent).toContain('may already have been imported');
    expect(component.canImport()).toBe(true);
    http.expectNone(url);
  });

  it('recovers from unexpected success responses instead of creating a broken lobby link', async () => {
    await component.selectFile(quizFile());
    component.importQuiz();
    http.expectOne(url).flush({ message: 'OK' });
    fixture.detectChanges();
    expect(component.importing()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('unexpected import response');
    expect(component.uncertainOutcome()).toBe(true);
    expect(fixture.nativeElement.querySelector('.host-lobby-link')).toBeNull();
    expect(component.canImport()).toBe(true);
  });

  it('unlocks after 120 seconds without retrying and warns before an explicit retry', async () => {
    await component.selectFile(quizFile());
    vi.useFakeTimers();
    component.importQuiz();
    const request = http.expectOne(url);
    vi.advanceTimersByTime(QUIZ_IMPORT_TIMEOUT_MS);
    fixture.detectChanges();
    expect(component.importing()).toBe(false);
    expect(request.cancelled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('not confirmed within 120 seconds');
    expect(fixture.nativeElement.textContent).toContain('has not been retried automatically');
    expect(component.canImport()).toBe(true);
    http.expectNone(url);
  });

  it('can explicitly start another upload after a successful import', async () => {
    await component.selectFile(quizFile());
    component.importQuiz();
    http.expectOne(url).flush({ message: 'OK', gameId: 417, joinCode: 'ABC123' });
    component.reset();
    fixture.detectChanges();
    expect(component.result()).toBeNull();
    expect(component.filename()).toBe('');
    expect(component.canImport()).toBe(false);
    expect(fixture.nativeElement.querySelector('#quiz-file').disabled).toBe(false);
  });

  it('ignores a previous file read that finishes after a newer selection', async () => {
    const readers: FileReader[] = [];
    vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) { readers.push(this); });
    const first = component.selectFile(quizFile({ ...quizFixture(), title: 'Old quiz' }));
    const second = component.selectFile(quizFile({ ...quizFixture(), title: 'New quiz' }));
    const complete = (reader: FileReader, title: string) => {
      Object.defineProperty(reader, 'result', { value: JSON.stringify({ ...quizFixture(), title }) });
      reader.dispatchEvent(new ProgressEvent('load'));
    };
    complete(readers[1], 'New quiz');
    await second;
    complete(readers[0], 'Old quiz');
    await first;
    expect(component.selection()?.preview.title).toBe('New quiz');
    expect(component.reading()).toBe(false);
  });
});
