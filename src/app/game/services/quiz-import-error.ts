import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import { QuizIssue, UnexpectedQuizImportResponseError } from '../models/quiz-import';
import { isRecord } from './quiz-file';

export function quizImportError(error: unknown): { message: string; issues: QuizIssue[]; uncertain: boolean } {
  if (error instanceof TimeoutError) {
    return { message: 'The import was not confirmed within 120 seconds.', issues: [], uncertain: true };
  }
  if (error instanceof UnexpectedQuizImportResponseError) {
    return { message: error.message, issues: [], uncertain: true };
  }
  if (error instanceof HttpErrorResponse) {
    const body: unknown = error.error;
    const issues = isRecord(body) && Array.isArray(body['issues'])
      ? body['issues'].filter((issue): issue is QuizIssue => isRecord(issue)
        && typeof issue['path'] === 'string' && typeof issue['message'] === 'string') : [];
    const messages: Record<number, string> = {
      0: 'Could not reach the game server. Check your connection.',
      400: 'The quiz was rejected. Check its JSON structure.',
      413: 'The quiz is too large. The maximum is 2,097,152 bytes (2 MiB).',
      415: 'The server could not accept this JSON request format.',
      500: 'The quiz could not be imported. Please try again later.',
    };
    const serverMessage = isRecord(body) && typeof body['message'] === 'string' ? body['message'].trim() : '';
    return {
      message: serverMessage || messages[error.status] || 'Could not import the quiz. Please try again later.',
      issues,
      uncertain: error.status === 0 || (error.status >= 200 && error.status < 300),
    };
  }
  return { message: 'Could not import the quiz. Please try again later.', issues: [], uncertain: false };
}
