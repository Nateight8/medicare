import { PrismaClient } from '@prisma/client';
import prisma from './lib/prisma';

export type Context = {
  prisma: PrismaClient;
  userId?: string; // Will be set by the authentication middleware
};

export const createContext = (): Context => ({
  prisma,
});
