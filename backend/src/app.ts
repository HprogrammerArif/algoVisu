import express, { type Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import apiRouter from './interfaces/http/routes';
import { notFoundHandler, errorHandler } from './interfaces/http/middlewares/errorHandler';

// createApp takes config (dependency injection) so it can be tested without a real env/DB.
export interface AppDeps {
  corsOrigin: string;
  env: string;
}

export function createApp(config: AppDeps): Express {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  if (config.env !== 'test') app.use(morgan('dev'));

  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
