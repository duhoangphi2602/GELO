-- AlterTable
ALTER TABLE "DiagnosticQuestion" ADD COLUMN     "is_active" BOOLEAN DEFAULT true;

-- AlterTable
ALTER TABLE "DiseaseRule" ADD COLUMN     "is_active" BOOLEAN DEFAULT true;
