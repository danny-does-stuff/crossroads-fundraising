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
  // Ensure string - prod RPC can deserialize password as non-string
  const passwordStr =
    typeof password === "string" ? password : String(password ?? "");
  // Workaround: genSalt then hash - passing rounds (10) directly to hash() can
  // fail in prod builds (bcryptjs internal genSalt path)
  const salt = await bcrypt.genSalt(10);
  console.log("[signup] createUser salt", salt);
  console.log("[signup] createUser salt length", salt.length);
  console.log("[signup] createUser passwordStr length", passwordStr.length);
  console.log("[signup] createUser passwordStr type", typeof passwordStr);
  console.log("[signup] createUser salt type", typeof salt);
  const hashedPassword = await bcrypt.hash(passwordStr, salt);
  console.log("[signup] createUser hashedPassword", hashedPassword);

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
  // Ensure string - prod RPC can deserialize password as non-string
  const passwordStr =
    typeof password === "string" ? password : String(password ?? "");
  // Workaround: genSalt then hash - passing rounds (10) directly to hash() can
  // fail in prod builds (bcryptjs internal genSalt path). Passing explicit salt string works.
  const salt = await bcrypt.genSalt(10);
  console.log("[signup] createUserWithAdminRole salt", salt);
  console.log("[signup] createUserWithAdminRole passwordStr", passwordStr);
  console.log("[signup] createUserWithAdminRole salt length", salt.length);
  console.log(
    "[signup] createUserWithAdminRole passwordStr length",
    passwordStr.length,
  );
  console.log(
    "[signup] createUserWithAdminRole passwordStr type",
    typeof passwordStr,
  );
  console.log("[signup] createUserWithAdminRole salt type", typeof salt);
  const hashedPassword = await bcrypt.hash(passwordStr, salt);
  console.log(
    "[signup] createUserWithAdminRole hashedPassword",
    hashedPassword,
  );

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
    typeof userWithPassword.password.hash === "string" ?
      userWithPassword.password.hash
    : String(userWithPassword.password.hash ?? "");

  const isValid = await bcrypt.compare(passwordStr, hashStr);

  if (!isValid) {
    return null;
  }

  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}
