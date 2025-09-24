import { SessionData } from 'express-session';

declare module 'express-serve-static-core' {
  interface Request {
    session: SessionData & {
      returnTo?: string;
    };
  }
}
