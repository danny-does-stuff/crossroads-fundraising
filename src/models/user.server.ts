import type {
  Password,
  Role,
  User,
} from "../../prisma/generated/prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "~/db.server";

export type { User };

export type UserInSession = Pick<User, "id" | "email"> & {
  roles: Array<{ role: Role }>;
};

export async function getUserById(
  id: User["id"],
): Promise<UserInSession | null> {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      roles: {
        select: {
          role: true,
        },
      },
    },
  });
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser({
  password,
  ...userData
}: Pick<User, "email"> & { password: string }) {
  console.log("[signup] createUser", {
    passwordType: typeof password,
    passwordLength: typeof password === "string" ? password.length : "n/a",
  });
  // Ensure string - prod RPC can deserialize password as non-string
  const passwordStr = typeof password === "string" ? password : String(password ?? "");
  let hashedPassword: string;
  try {
    hashedPassword = await bcrypt.hash(passwordStr, 10);
    console.log("[signup] createUser bcrypt.hash done");
  } catch (err) {
    console.error("[signup] createUser bcrypt.hash failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

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

export async function createUserWithAdminRole({
  email,
  password,
}: Pick<User, "email"> & { password: string }) {
  console.log("[signup] createUserWithAdminRole", {
    email,
    passwordType: typeof password,
    passwordLength: typeof password === "string" ? password.length : "n/a",
    passwordConstructor: password?.constructor?.name,
  });
  // Ensure string - prod RPC can deserialize password as non-string
  const passwordStr = typeof password === "string" ? password : String(password ?? "");
  console.log("[signup] createUserWithAdminRole passwordStr", {
    type: typeof passwordStr,
    length: passwordStr.length,
  });
  let hashedPassword: string;
  try {
    hashedPassword = await bcrypt.hash(passwordStr, 10);
    console.log("[signup] createUserWithAdminRole bcrypt.hash done");
  } catch (err) {
    console.error("[signup] createUserWithAdminRole bcrypt.hash failed", {
      error: err instanceof Error ? err.message : String(err),
      passwordStrType: typeof passwordStr,
      passwordStrLength: passwordStr.length,
    });
    throw err;
  }

  return prisma.user.create({
    data: {
      email,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
      roles: {
        create: {
          role: {
            connectOrCreate: {
              where: { name: "ADMIN" },
              create: { name: "ADMIN" },
            },
          },
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
  password: Password["hash"],
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

  const passwordStr =
    typeof password === "string" ? password : String(password ?? "");
  const hashStr =
    typeof userWithPassword.password.hash === "string"
      ? userWithPassword.password.hash
      : String(userWithPassword.password.hash ?? "");

  const isValid = await bcrypt.compare(passwordStr, hashStr);

  if (!isValid) {
    return null;
  }

  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}
