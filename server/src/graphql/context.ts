import { PrismaClient } from '@prisma/client';

import { Request, Response } from 'express';
import { User } from '@prisma/client';

export interface Context {
  prisma: PrismaClient;
  user: User | null;
  req: Request;
  res: Response;
  userId?: string;
}

export function createContext(
  prisma: PrismaClient, 
  req?: Request, 
  res?: Response,
  user: User | null = null
): Context {
  return {
    prisma,
    user,
    req: req as Request,
    res: res as Response,
  };
}
