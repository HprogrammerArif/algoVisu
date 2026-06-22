import { body } from 'express-validator';

const VISUALIZER_TYPES = ['array', 'grid', 'graph', 'matrix', 'string', 'math'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

export const algorithmBodyValidators = [
  body('categoryId').isInt({ min: 1 }).withMessage('categoryId must be a positive integer'),
  body('slug').isString().trim().notEmpty().withMessage('slug is required'),
  body('name').isString().trim().notEmpty().withMessage('name is required'),
  body('visualizerType').isIn(VISUALIZER_TYPES).withMessage('invalid visualizerType'),
  body('difficulty').optional({ nullable: true }).isIn(DIFFICULTIES).withMessage('invalid difficulty'),
  body('timeComplexities').isObject().withMessage('timeComplexities is required'),
  body('timeComplexities.best').isString().notEmpty().withMessage('timeComplexities.best is required'),
  body('timeComplexities.average').isString().notEmpty().withMessage('timeComplexities.average is required'),
  body('timeComplexities.worst').isString().notEmpty().withMessage('timeComplexities.worst is required'),
  body('codeSnippets').isArray().withMessage('codeSnippets must be an array'),
];
