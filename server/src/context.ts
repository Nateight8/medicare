import { PrismaClient } from '@prisma/client';
import prisma from './lib/prisma';

export type Context = {
  prisma: PrismaClient;
  userEmail?: string; // Will be set by the authentication middleware
  user?: any; // The full user object if available
};

export const createContext = (): Context => ({
  prisma,
});
