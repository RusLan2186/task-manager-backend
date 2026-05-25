-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('GOOGLE', 'LOCAL', 'GITHUB');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "provider" "Provider" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN     "providerId" TEXT,
ALTER COLUMN "password" DROP NOT NULL;
