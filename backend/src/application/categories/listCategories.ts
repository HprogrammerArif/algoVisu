import type { Category } from '../../domain/entities/Category';
import type { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';

export interface ListCategoriesDeps {
  categories: ICategoryRepository;
}

export async function listCategories(deps: ListCategoriesDeps): Promise<Category[]> {
  return deps.categories.findAll();
}
