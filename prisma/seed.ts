import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  const email = "rachel@remix.run";

  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  // const hashedPassword = await bcrypt.hash("racheliscool", 10);

  // const user = await prisma.user.create({
  //   data: {
  //     email,
  //     password: {
  //       create: {
  //         hash: hashedPassword,
  //       },
  //     },
  //   },
  // });

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
