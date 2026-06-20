import { body } from 'express-validator';

export const categoryBodyValidators = [
  body('slug').isString().trim().notEmpty().withMessage('slug is required'),
  body('name').isString().trim().notEmpty().withMessage('name is required'),
  body('displayOrder').optional().isInt().withMessage('displayOrder must be an integer'),
];
