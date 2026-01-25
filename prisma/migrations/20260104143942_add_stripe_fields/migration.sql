-- AlterTable
ALTER TABLE "Donation" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Donation" ADD COLUMN "stripePaymentIntentId" TEXT;
ALTER TABLE "Donation" ADD COLUMN "stripeSessionId" TEXT;

-- AlterTable
ALTER TABLE "MulchOrder" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "MulchOrder" ADD COLUMN "stripePaymentIntentId" TEXT;
ALTER TABLE "MulchOrder" ADD COLUMN "stripeSessionId" TEXT;
