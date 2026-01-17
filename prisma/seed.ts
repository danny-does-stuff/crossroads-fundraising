import { PrismaClient } from "./generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL }),
});

async function seed() {
  const email = "rachel@remix.run";
  const adminEmail = "admin@remix.run";

  // cleanup the existing database
  await Promise.allSettled([
    prisma.user.deleteMany({ where: { email: { in: [email, adminEmail] } } }),
    prisma.role.deleteMany(),
  ]);

  const hashedPassword = await bcrypt.hash("racheliscool", 10);
  const hashedAdminPassword = await bcrypt.hash("testtest", 10);

  await Promise.all([
    prisma.user.create({
      data: {
        email,
        password: {
          create: {
            hash: hashedPassword,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: adminEmail,
        password: {
          create: {
            hash: hashedAdminPassword,
          },
        },
        roles: {
          create: {
            role: {
              create: {
                name: "ADMIN",
              },
            },
          },
        },
      },
    }),
  ]);

  const customer = await prisma.customer.create({
    data: {
      name: "Rachel",
      email: "customer@custo.mer",
      phone: "555-555-5555",
    },
  });

  await Promise.all([
    prisma.mulchOrder.create({
      data: {
        color: "BLACK",
        quantity: 10,
        customerId: customer.id,
        pricePerUnit: 10,
        orderType: "SPREAD",
        neighborhood: "Arrowbrooke",
        streetAddress: "1234 Arrowbrooke Lane",
      },
    }),
    prisma.mulchOrder.create({
      data: {
        color: "BROWN",
        quantity: 5,
        customerId: customer.id,
        pricePerUnit: 4,
        orderType: "DELIVERY",
        neighborhood: "Savannah",
        streetAddress: "1234 Ranch Trial Rd",
      },
    }),
  ]);

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
