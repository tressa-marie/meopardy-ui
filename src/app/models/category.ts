import { Clue } from "./clue";

export interface Category {
  id: number;
  name: string;
  clues: Clue[];
}