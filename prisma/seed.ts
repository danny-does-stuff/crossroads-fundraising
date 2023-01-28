import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  const email = "rachel@remix.run";

  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  const hashedPassword = await bcrypt.hash("racheliscool", 10);

  const user = await prisma.user.create({
    data: {
      phone: "123-456-7890",
      name: "Rachel Coolio",
      email,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });

  const address = await prisma.address.create({
    data: {
      street: "123 Main St",
      neighborhood: "Arrowbrooke",
      city: "San Francisco",
      state: "CA",
      zip: "94111",
      userId: user.id,
    },
  });

  await Promise.all([
    prisma.mulchOrder.create({
      data: {
        color: "BLACK",
        quantity: 10,
        userId: user.id,
        pricePerUnit: 10,
        orderType: "SPREAD",
        deliveryAddressId: address.id,
      },
    }),
    prisma.mulchOrder.create({
      data: {
        color: "BROWN",
        quantity: 5,
        userId: user.id,
        pricePerUnit: 4,
        orderType: "DELIVERY",
        deliveryAddressId: address.id,
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
