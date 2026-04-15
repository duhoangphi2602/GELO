/*
  Warnings:

  - You are about to alter the column `image_url` on the `ScanImage` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - Added the required column `updated_at` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Made the column `password_hash` on table `Account` required. This step will fail if there are existing NULL values in that column.
  - Made the column `role` on table `Account` required. This step will fail if there are existing NULL values in that column.
  - Made the column `scan_id` on table `ScanImage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `image_url` on table `ScanImage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `patient_id` on table `SkinDiary` required. This step will fail if there are existing NULL values in that column.
  - Made the column `patient_id` on table `SkinScan` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ScanImage" DROP CONSTRAINT "ScanImage_scan_id_fkey";

-- DropForeignKey
ALTER TABLE "SkinDiary" DROP CONSTRAINT "SkinDiary_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "SkinScan" DROP CONSTRAINT "SkinScan_patient_id_fkey";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "password_hash" SET NOT NULL,
ALTER COLUMN "role" SET NOT NULL;

-- AlterTable
ALTER TABLE "ScanImage" ALTER COLUMN "scan_id" SET NOT NULL,
ALTER COLUMN "image_url" SET NOT NULL,
ALTER COLUMN "image_url" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "SkinDiary" ALTER COLUMN "patient_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "SkinScan" ALTER COLUMN "patient_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "SkinScan" ADD CONSTRAINT "SkinScan_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("patient_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanImage" ADD CONSTRAINT "ScanImage_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "SkinScan"("scan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkinDiary" ADD CONSTRAINT "SkinDiary_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("patient_id") ON DELETE RESTRICT ON UPDATE CASCADE;
