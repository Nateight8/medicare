import { PrismaClient, User } from '@prisma/client';
import { Request, Response } from 'express';

export type ContextUser = {
  id?: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  timeZone?: string;
  createdAt?: Date;
  updatedAt?: Date;
} | null;

export interface Context {
  prisma: PrismaClient;
  user: ContextUser;
}

export function createContext(
  prisma: PrismaClient,
  user: ContextUser = null
): Context {
  return {
    prisma,
    user
  };
}
