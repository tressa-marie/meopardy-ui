import { loadQuizFile, MAX_QUIZ_FILE_BYTES, parseQuizJson, validateQuiz } from './quiz-file';
import { quizFile, quizFixture } from '../../testing/quiz-fixtures';

describe('Quiz file parsing and validation', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reads a real JSON File locally and preserves its explicit timer', async () => {
    const result = await loadQuizFile(quizFile(quizFixture(), 'quiz.JSON'));
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.quiz.rounds[0].categories[0].clues[0].timeLimitSeconds).toBe(40);
      expect(result.preview).toEqual({ title: 'My Quiz', roundCount: 1, categoryCount: 1, questionCount: 1 });
    }
  });

  it('accepts a UTF-8 BOM before JSON', () => {
    expect(parseQuizJson('\uFEFF' + JSON.stringify(quizFixture())).valid).toBe(true);
  });

  it('reports invalid JSON and empty files readably', () => {
    expect(() => parseQuizJson('{"title":')).toThrow('not valid JSON');
    expect(() => parseQuizJson('   ')).toThrow('file is empty');
  });

  it('rejects non-JSON filenames before reading them', async () => {
    const read = vi.spyOn(FileReader.prototype, 'readAsText');
    await expect(loadQuizFile(quizFile(quizFixture(), 'quiz.txt'))).rejects.toThrow('.json extension');
    expect(read).not.toHaveBeenCalled();
  });

  it('rejects files one byte above the size limit before reading', async () => {
    const file = new File([' '.repeat(MAX_QUIZ_FILE_BYTES + 1)], 'large.json');
    const read = vi.spyOn(FileReader.prototype, 'readAsText');
    await expect(loadQuizFile(file)).rejects.toThrow('2,097,152 bytes');
    expect(read).not.toHaveBeenCalled();
  });

  it('accepts a valid file exactly at the byte limit', async () => {
    const content = JSON.stringify(quizFixture()).padEnd(MAX_QUIZ_FILE_BYTES, ' ');
    const file = new File([content], 'limit.json');
    expect(file.size).toBe(MAX_QUIZ_FILE_BYTES);
    expect((await loadQuizFile(file)).valid).toBe(true);
  });

  it('reports file read failures', async () => {
    vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
      this.dispatchEvent(new ProgressEvent('error'));
    });
    await expect(loadQuizFile(quizFile())).rejects.toThrow('Could not read this file');
  });

  it.each([null, [], 'quiz', 123])('rejects a non-object root: %j', value => {
    expect(validateQuiz(value)).toEqual({ valid: false, issues: [{ path: '$', message: 'Must be a JSON object' }] });
  });

  it.each([
    ['title', { ...quizFixture(), title: '   ' }],
    ['rounds', { title: 'Quiz', rounds: [] }],
    ['rounds.0', { title: 'Quiz', rounds: [null] }],
    ['rounds.0.name', { title: 'Quiz', rounds: [{ name: '', categories: [] }] }],
    ['rounds.0.categories', { title: 'Quiz', rounds: [{ name: 'Round', categories: [] }] }],
    ['rounds.0.categories.0', { title: 'Quiz', rounds: [{ name: 'Round', categories: [null] }] }],
    ['rounds.0.categories.0.name', { title: 'Quiz', rounds: [{ name: 'Round', categories: [{ name: ' ', clues: [] }] }] }],
    ['rounds.0.categories.0.clues', { title: 'Quiz', rounds: [{ name: 'Round', categories: [{ name: 'Category', clues: [] }] }] }],
  ])('reports the invalid structure at %s', (path, value) => {
    const result = validateQuiz(value);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.issues).toContainEqual(expect.objectContaining({ path }));
  });

  it.each([
    ['question', ' '], ['correctAnswer', ''], ['basePoints', 0], ['basePoints', -100],
    ['basePoints', 1.5], ['basePoints', '100'], ['timeLimitSeconds', 0], ['timeLimitSeconds', -20],
    ['timeLimitSeconds', 2.5], ['timeLimitSeconds', null], ['acceptableAnswers', 'Mars'],
    ['acceptableAnswers', [123]], ['acceptableAnswers', [' ']],
  ])('rejects invalid clue %s=%j', (field, value) => {
    const quiz = quizFixture();
    Object.assign(quiz.rounds[0].categories[0].clues[0], { [field]: value });
    const result = validateQuiz(quiz);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.issues.some(issue => issue.path.startsWith(`rounds.0.categories.0.clues.0.${field}`))).toBe(true);
  });

  it('leaves optional fields absent for backend defaults instead of overwriting timers', () => {
    const quiz = quizFixture();
    const clue = quiz.rounds[0].categories[0].clues[0];
    delete clue.acceptableAnswers;
    delete clue.timeLimitSeconds;
    const result = validateQuiz(quiz);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.quiz).toBe(quiz);
      expect(result.quiz.rounds[0].categories[0].clues[0]).not.toHaveProperty('timeLimitSeconds');
      expect(result.quiz.rounds[0].categories[0].clues[0]).not.toHaveProperty('acceptableAnswers');
    }
  });

  it('counts categories and questions across all rounds', () => {
    const quiz = quizFixture();
    quiz.rounds[0].categories[0].clues.push({ ...quiz.rounds[0].categories[0].clues[0] });
    quiz.rounds[0].categories.push(structuredClone(quiz.rounds[0].categories[0]));
    quiz.rounds.push(structuredClone(quiz.rounds[0]));
    const result = validateQuiz(quiz);
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.preview).toEqual({ title: 'My Quiz', roundCount: 2, categoryCount: 4, questionCount: 8 });
  });
});
