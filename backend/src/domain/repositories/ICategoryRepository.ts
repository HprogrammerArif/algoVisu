import type { Category } from '../entities/Category';

export interface NewCategory {
  slug: string;
  name: string;
  description?: string | null;
  displayOrder?: number;
}

export interface ICategoryRepository {
  findAll(): Promise<Category[]>;
  findById(id: number): Promise<Category | null>;
  create(category: NewCategory): Promise<Category>;
  update(id: number, category: NewCategory): Promise<Category | null>;
  remove(id: number): Promise<boolean>;
  countAlgorithms(id: number): Promise<number>;
}
