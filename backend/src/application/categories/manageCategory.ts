import { AppError } from '../../shared/errors/AppError';
import type { Category } from '../../domain/entities/Category';
import type {
  ICategoryRepository,
  NewCategory,
} from '../../domain/repositories/ICategoryRepository';

export interface ManageCategoryDeps {
  categories: ICategoryRepository;
}

export async function createCategory(
  deps: ManageCategoryDeps,
  input: NewCategory,
): Promise<Category> {
  return deps.categories.create(input);
}

export async function updateCategory(
  deps: ManageCategoryDeps,
  id: number,
  input: NewCategory,
): Promise<Category> {
  const updated = await deps.categories.update(id, input);
  if (!updated) {
    throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
  }
  return updated;
}

export async function deleteCategory(deps: ManageCategoryDeps, id: number): Promise<void> {
  const inUse = await deps.categories.countAlgorithms(id);
  if (inUse > 0) {
    throw new AppError(409, 'CATEGORY_IN_USE', 'Category still has algorithms');
  }
  const removed = await deps.categories.remove(id);
  if (!removed) {
    throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
  }
}
