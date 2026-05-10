import { Category } from './category';

export interface GameBoard {
  id: number;
  title: string;
  categories: Category[];
}