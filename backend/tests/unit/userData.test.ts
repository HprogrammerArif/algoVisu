import { describe, it, expect } from 'vitest';
import { addBookmark, removeBookmark } from '../../src/application/bookmarks/bookmarks';
import { upsertProgress, getProgress } from '../../src/application/progress/progress';
import { createFakeAlgorithmRepository } from '../helpers/fakeAlgorithmRepository';
import { createFakeBookmarkRepository } from '../helpers/fakeBookmarkRepository';
import { createFakeProgressRepository } from '../helpers/fakeProgressRepository';

function setup() {
  const algorithms = createFakeAlgorithmRepository();
  const bookmarks = createFakeBookmarkRepository(algorithms);
  const progress = createFakeProgressRepository(algorithms);
  return { algorithms, bookmarks, progress };
}

describe('addBookmark', () => {
  it('adds a bookmark for an existing algorithm', async () => {
    const { algorithms, bookmarks } = setup();
    const result = await addBookmark({ bookmarks, algorithms }, 7, 1);
    expect(result.algorithmId).toBe(1);
    expect(result.slug).toBe('bubble-sort');
  });

  it('is idempotent (re-adding returns the same bookmark)', async () => {
    const { algorithms, bookmarks } = setup();
    const a = await addBookmark({ bookmarks, algorithms }, 7, 1);
    const b = await addBookmark({ bookmarks, algorithms }, 7, 1);
    expect(b.id).toBe(a.id);
    expect(bookmarks._rows.length).toBe(1);
  });

  it('rejects an unknown algorithm with 404', async () => {
    const { algorithms, bookmarks } = setup();
    await expect(addBookmark({ bookmarks, algorithms }, 7, 999)).rejects.toMatchObject({
      statusCode: 404,
      code: 'ALGORITHM_NOT_FOUND',
    });
  });
});

describe('removeBookmark', () => {
  it('removes a bookmark', async () => {
    const { algorithms, bookmarks } = setup();
    await addBookmark({ bookmarks, algorithms }, 7, 1);
    await removeBookmark({ bookmarks, algorithms }, 7, 1);
    expect(bookmarks._rows.length).toBe(0);
  });
});

describe('upsertProgress', () => {
  it('creates then updates progress for one algorithm', async () => {
    const { algorithms, progress } = setup();
    await upsertProgress({ progress, algorithms }, 7, 2, 'in_progress');
    const updated = await upsertProgress({ progress, algorithms }, 7, 2, 'completed');
    expect(updated.status).toBe('completed');
    const all = await getProgress({ progress, algorithms }, 7);
    expect(all.length).toBe(1);
  });

  it('rejects an unknown algorithm with 404', async () => {
    const { algorithms, progress } = setup();
    await expect(
      upsertProgress({ progress, algorithms }, 7, 999, 'completed'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
