import { PrismaClient, User } from "@prisma/client";
import { Request, Response } from "express";

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
  res?: Response | undefined;
  req?: Request | undefined;
}

export function createContext(
  prisma: PrismaClient,
  user: ContextUser = null,
  res?: Response,
  req?: Request
): Context {
  return {
    prisma,
    user,
    res,
    req,
  };
}

export type GraphqlContext = Context;
