-- AlterTable
ALTER TABLE "Disease" ADD COLUMN     "has_blister" BOOLEAN DEFAULT false,
ADD COLUMN     "has_scaling" BOOLEAN DEFAULT false,
ADD COLUMN     "status" VARCHAR(20) DEFAULT 'active',
ALTER COLUMN "visual_pattern" SET DATA TYPE TEXT;
