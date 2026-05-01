import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/auth.js';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  try {
    req.auth = verifyAccessToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
