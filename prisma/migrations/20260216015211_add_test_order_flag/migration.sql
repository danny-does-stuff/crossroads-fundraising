-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MulchOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL,
    "pricePerUnit" REAL NOT NULL,
    "color" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "note" TEXT,
    "neighborhood" TEXT NOT NULL,
    "streetAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paypalOrderId" TEXT,
    "paypalPaymentSource" TEXT,
    "paypalPayerId" TEXT,
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeCustomerId" TEXT,
    "referralSource" TEXT,
    "referralSourceDetails" TEXT,
    "isTestOrder" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "customerId" INTEGER NOT NULL,
    CONSTRAINT "MulchOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MulchOrder" ("color", "createdAt", "customerId", "id", "neighborhood", "note", "orderType", "paypalOrderId", "paypalPayerId", "paypalPaymentSource", "pricePerUnit", "quantity", "referralSource", "referralSourceDetails", "status", "streetAddress", "stripeCustomerId", "stripePaymentIntentId", "stripeSessionId", "updatedAt") SELECT "color", "createdAt", "customerId", "id", "neighborhood", "note", "orderType", "paypalOrderId", "paypalPayerId", "paypalPaymentSource", "pricePerUnit", "quantity", "referralSource", "referralSourceDetails", "status", "streetAddress", "stripeCustomerId", "stripePaymentIntentId", "stripeSessionId", "updatedAt" FROM "MulchOrder";
DROP TABLE "MulchOrder";
ALTER TABLE "new_MulchOrder" RENAME TO "MulchOrder";
CREATE UNIQUE INDEX "MulchOrder_stripeSessionId_key" ON "MulchOrder"("stripeSessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
