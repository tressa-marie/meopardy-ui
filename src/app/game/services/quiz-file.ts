import { QuizImport, QuizIssue, QuizPreview } from '../models/quiz-import';

export const MAX_QUIZ_FILE_BYTES = 2_097_152;

export type QuizValidation =
  | { valid: true; quiz: QuizImport; preview: QuizPreview }
  | { valid: false; issues: QuizIssue[] };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateQuiz(value: unknown): QuizValidation {
  const issues: QuizIssue[] = [];
  const text = (value: unknown, path: string) => {
    if (typeof value !== 'string' || !value.trim()) issues.push({ path, message: 'Must be nonblank text' });
  };
  const positiveInteger = (value: unknown, path: string) => {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      issues.push({ path, message: 'Must be a positive integer' });
    }
  };
  const object = (value: unknown, path: string): value is Record<string, unknown> => {
    if (isRecord(value)) return true;
    issues.push({ path, message: 'Must be a JSON object' });
    return false;
  };
  const nonemptyArray = (value: unknown, path: string): value is unknown[] => {
    if (Array.isArray(value) && value.length > 0) return true;
    issues.push({ path, message: 'Must be an array with at least one item' });
    return false;
  };

  if (!object(value, '$')) return { valid: false, issues };
  text(value['title'], 'title');
  let categoryCount = 0;
  let questionCount = 0;
  if (nonemptyArray(value['rounds'], 'rounds')) {
    value['rounds'].forEach((round, r) => {
      const roundPath = `rounds.${r}`;
      if (!object(round, roundPath)) return;
      text(round['name'], `${roundPath}.name`);
      if (!nonemptyArray(round['categories'], `${roundPath}.categories`)) return;
      categoryCount += round['categories'].length;
      round['categories'].forEach((category, c) => {
        const categoryPath = `${roundPath}.categories.${c}`;
        if (!object(category, categoryPath)) return;
        text(category['name'], `${categoryPath}.name`);
        if (!nonemptyArray(category['clues'], `${categoryPath}.clues`)) return;
        questionCount += category['clues'].length;
        category['clues'].forEach((clue, q) => {
          const cluePath = `${categoryPath}.clues.${q}`;
          if (!object(clue, cluePath)) return;
          text(clue['question'], `${cluePath}.question`);
          text(clue['correctAnswer'], `${cluePath}.correctAnswer`);
          positiveInteger(clue['basePoints'], `${cluePath}.basePoints`);
          if (clue['timeLimitSeconds'] !== undefined) {
            positiveInteger(clue['timeLimitSeconds'], `${cluePath}.timeLimitSeconds`);
          }
          if (clue['acceptableAnswers'] !== undefined) {
            if (!Array.isArray(clue['acceptableAnswers'])) {
              issues.push({ path: `${cluePath}.acceptableAnswers`, message: 'Must be an array of text answers' });
            } else {
              clue['acceptableAnswers'].forEach((answer, a) => text(answer, `${cluePath}.acceptableAnswers.${a}`));
            }
          }
        });
      });
    });
  }
  if (issues.length) return { valid: false, issues };
  // Keep the parsed object intact, including explicit timers. The server supplies optional defaults.
  const quiz = value as unknown as QuizImport;
  return { valid: true, quiz, preview: { title: quiz.title, roundCount: quiz.rounds.length, categoryCount, questionCount } };
}

export function parseQuizJson(content: string): QuizValidation {
  if (!content.trim()) throw new Error('The file is empty. Choose a JSON file containing a quiz.');
  let parsed: unknown;
  try { parsed = JSON.parse(content.replace(/^\uFEFF/, '')); }
  catch { throw new Error('This file is not valid JSON. Check for missing quotes, commas, or brackets.'); }
  return validateQuiz(parsed);
}

export async function loadQuizFile(file: File): Promise<QuizValidation> {
  if (!/\.json$/i.test(file.name)) throw new Error('Choose a file with a .json extension.');
  if (file.size > MAX_QUIZ_FILE_BYTES) {
    throw new Error('The file is too large. The maximum is 2,097,152 bytes (2 MiB).');
  }
  const content = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Could not read this file as text. Please choose it again.'));
    };
    reader.onerror = () => reject(new Error('Could not read this file. Please choose it again.'));
    reader.onabort = () => reject(new Error('Reading the file was cancelled. Please choose it again.'));
    reader.readAsText(file, 'UTF-8');
  });
  return parseQuizJson(content);
}
