import { redirect } from "@tanstack/react-router";
import { getRequest, setCookie, getCookie } from "@tanstack/react-start/server";
import invariant from "tiny-invariant";

import type { User } from "~/models/user.server";
import type { UserInSession } from "~/models/user.server";
import { getUserById } from "~/models/user.server";

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");

const SESSION_KEY = "__session";

// Simple cookie-based session management
function encodeSession(userId: number): string {
  // Simple encoding - in production you'd want proper signing/encryption
  return Buffer.from(JSON.stringify({ userId })).toString("base64");
}

function decodeSession(value: string): { userId?: number } | null {
  try {
    return JSON.parse(Buffer.from(value, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

export async function getUserId(): Promise<User["id"] | undefined> {
  const cookieValue = getCookie(SESSION_KEY);
  if (!cookieValue) return undefined;

  const session = decodeSession(cookieValue);
  return session?.userId;
}

export async function getUser(
  _request?: Request
): Promise<UserInSession | null> {
  const userId = await getUserId();
  if (userId === undefined) return null;

  const user = await getUserById(userId);
  if (user) return user;

  // Clear invalid session
  setCookie(SESSION_KEY, "", { maxAge: 0 });
  return null;
}

export async function requireUserId(request?: Request, redirectTo?: string) {
  const userId = await getUserId();
  if (!userId) {
    const req = getRequest();
    const pathname = redirectTo || new URL(req.url).pathname;
    throw redirect({
      to: `/login`,
      search: {
        redirectTo: pathname,
      },
    });
  }
  return userId;
}

export async function requireUser(request?: Request) {
  const userId = await requireUserId(request);

  const user = await getUserById(userId);
  if (user) return user;

  throw await logout();
}

export async function createUserSession({
  userId,
  remember,
  redirectTo,
}: {
  request?: Request;
  userId: number;
  remember: boolean;
  redirectTo: string;
}) {
  const sessionValue = encodeSession(userId);

  setCookie(SESSION_KEY, sessionValue, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: remember ? 60 * 60 * 24 * 7 : undefined, // 7 days if remember
  });

  throw redirect({ to: redirectTo });
}

export async function logout() {
  setCookie(SESSION_KEY, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });

  throw redirect({ to: "/" });
}
