import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { productsRouter } from './routes/products.js';
import { dashboardRouter } from './routes/dashboard.js';
import { settingsRouter } from './routes/settings.js';
import { errorHandler, notFound } from './middleware/error.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools and common local frontend dev origins.
      if (!origin) return callback(null, true);
      const allowed = env.corsOrigins.includes(origin);
      return callback(allowed ? null : new Error(`CORS blocked for origin: ${origin}`), allowed);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'stockflow-backend' });
});

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/settings', settingsRouter);

app.use(notFound);
app.use(errorHandler);
