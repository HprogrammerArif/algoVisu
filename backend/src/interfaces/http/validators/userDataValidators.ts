import { body } from 'express-validator';
import { PROGRESS_STATUSES } from '../../../domain/entities/Progress';

export const bookmarkBodyValidators = [
  body('algorithmId').isInt({ min: 1 }).withMessage('algorithmId must be a positive integer'),
];

export const progressBodyValidators = [
  body('status').isIn(PROGRESS_STATUSES).withMessage('invalid status'),
];
