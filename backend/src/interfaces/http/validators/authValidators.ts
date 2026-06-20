import { body } from 'express-validator';

export const registerValidators = [
  body('fullName').isString().trim().notEmpty().withMessage('fullName is required'),
  body('email').isEmail().withMessage('a valid email is required').normalizeEmail(),
  body('password')
    .isString()
    .isLength({ min: 8 })
    .withMessage('password must be at least 8 characters'),
];

export const loginValidators = [
  body('email').isEmail().withMessage('a valid email is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('password is required'),
];
