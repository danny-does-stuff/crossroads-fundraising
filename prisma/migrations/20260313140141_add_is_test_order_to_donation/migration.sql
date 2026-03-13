-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Donation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "isTestOrder" BOOLEAN NOT NULL DEFAULT false,
    "paypalOrderId" TEXT,
    "paypalPaymentSource" TEXT,
    "paypalPayerId" TEXT,
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeCustomerId" TEXT,
    "donorGivenName" TEXT,
    "donorSurname" TEXT,
    "donorEmail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Donation" ("amount", "createdAt", "donorEmail", "donorGivenName", "donorSurname", "id", "paypalOrderId", "paypalPayerId", "paypalPaymentSource", "stripeCustomerId", "stripePaymentIntentId", "stripeSessionId", "updatedAt") SELECT "amount", "createdAt", "donorEmail", "donorGivenName", "donorSurname", "id", "paypalOrderId", "paypalPayerId", "paypalPaymentSource", "stripeCustomerId", "stripePaymentIntentId", "stripeSessionId", "updatedAt" FROM "Donation";
DROP TABLE "Donation";
ALTER TABLE "new_Donation" RENAME TO "Donation";
CREATE UNIQUE INDEX "Donation_stripeSessionId_key" ON "Donation"("stripeSessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
