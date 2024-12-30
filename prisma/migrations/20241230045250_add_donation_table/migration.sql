-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "paypalOrderId" TEXT,
    "paypalPaymentSource" TEXT,
    "paypalPayerId" TEXT,
    "donorName" TEXT,
    "donorEmail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
