import type { JwtPayload } from '../utils/auth.js';

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

export {};
