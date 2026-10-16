-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "eiId";
ALTER TABLE "User" DROP COLUMN IF EXISTS "stripeCustomerId";
ALTER TABLE "User" DROP COLUMN IF EXISTS "stripeSubscriptionId";
ALTER TABLE "User" DROP COLUMN IF EXISTS "stripePriceId";
ALTER TABLE "User" DROP COLUMN IF EXISTS "stripeCurrentPeriodEnd";
