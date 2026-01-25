-- CreateIndex
CREATE UNIQUE INDEX "Donation_stripeSessionId_key" ON "Donation"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "MulchOrder_stripeSessionId_key" ON "MulchOrder"("stripeSessionId");

