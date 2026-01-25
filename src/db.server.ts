import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../prisma/generated/prisma/client";

let prisma: PrismaClient;

declare global {
  var __db__: PrismaClient;
}

function getAdapter() {
  return new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// in production we'll have a single connection to the DB.
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({ adapter: getAdapter() });
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient({ adapter: getAdapter() });
  }
  prisma = global.__db__;
  prisma.$connect();
}

export { prisma };
