/*
  Warnings:

  - You are about to drop the column `donorName` on the `Donation` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Donation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "paypalOrderId" TEXT,
    "paypalPaymentSource" TEXT,
    "paypalPayerId" TEXT,
    "donorGivenName" TEXT,
    "donorSurname" TEXT,
    "donorEmail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Donation" ("amount", "createdAt", "donorEmail", "id", "paypalOrderId", "paypalPayerId", "paypalPaymentSource", "updatedAt") SELECT "amount", "createdAt", "donorEmail", "id", "paypalOrderId", "paypalPayerId", "paypalPaymentSource", "updatedAt" FROM "Donation";
DROP TABLE "Donation";
ALTER TABLE "new_Donation" RENAME TO "Donation";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
