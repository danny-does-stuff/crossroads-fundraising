import type {
  Password,
  Role,
  User,
} from "../../prisma/generated/prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "~/db.server";

export type { User };

export type UserInSession = Pick<User, 'id' | 'email'> & {roles: Array<{role: Role}>}

export async function getUserById(id: User["id"]): Promise<UserInSession | null> {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      roles: {
        select: {
          role: true,
        }
      },
    }
  });
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser({
  password,
  ...userData
}: Pick<User, "email"> & { password: string }) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      ...userData,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });
}

export async function deleteUsersByEmail(email: User["email"]) {
  return prisma.user.deleteMany({ where: { email } });
}

export async function verifyLogin(
  email: User["email"],
  password: Password["hash"]
) {
  const userWithPassword = await prisma.user.findUnique({
    where: { email },
    include: {
      password: true,
      roles: {
        select: {
          role: true,
        },
      },
    },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(
    password,
    userWithPassword.password.hash
  );

  if (!isValid) {
    return null;
  }

  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}
