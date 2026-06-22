export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export const PROGRESS_STATUSES: ProgressStatus[] = ['not_started', 'in_progress', 'completed'];

export interface ProgressItem {
  algorithmId: number;
  slug: string;
  name: string;
  status: ProgressStatus;
  lastViewedAt: string;
}
