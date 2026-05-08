-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PATIENT');

-- CreateEnum
CREATE TYPE "FeedbackRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "DiagnosticStatus" AS ENUM ('DISEASE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "OtpType" AS ENUM ('REGISTER', 'FORGOT_PASSWORD', 'CHANGE_PASSWORD');

-- CreateEnum
CREATE TYPE "ImageQuality" AS ENUM ('CLEAR', 'BLURRY');

-- CreateTable
CREATE TABLE "Account" (
    "account_id" SERIAL NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PATIENT',

    CONSTRAINT "Account_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "patient_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "full_name" VARCHAR(100),
    "age" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gender" "Gender" DEFAULT 'UNKNOWN',

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("patient_id")
);

-- CreateTable
CREATE TABLE "Disease" (
    "disease_id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,

    CONSTRAINT "Disease_pkey" PRIMARY KEY ("disease_id")
);

-- CreateTable
CREATE TABLE "DiseaseImage" (
    "image_id" SERIAL NOT NULL,
    "disease_id" INTEGER,
    "scan_id" INTEGER,
    "image_url" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiseaseImage_pkey" PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "DiseaseAdvice" (
    "advice_id" SERIAL NOT NULL,
    "disease_id" INTEGER,
    "advice_type" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "priority" INTEGER,

    CONSTRAINT "DiseaseAdvice_pkey" PRIMARY KEY ("advice_id")
);

-- CreateTable
CREATE TABLE "SkinScan" (
    "scan_id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "image_quality" "ImageQuality" NOT NULL DEFAULT 'CLEAR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SkinScan_pkey" PRIMARY KEY ("scan_id")
);

-- CreateTable
CREATE TABLE "ScanImage" (
    "image_id" SERIAL NOT NULL,
    "scan_id" INTEGER NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanImage_pkey" PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "prediction_id" SERIAL NOT NULL,
    "scan_id" INTEGER,
    "disease_id" INTEGER,
    "confidence" DOUBLE PRECISION,
    "model_version" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diagnostic_status" "DiagnosticStatus" NOT NULL DEFAULT 'DISEASE',

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("prediction_id")
);

-- CreateTable
CREATE TABLE "DiagnosisResult" (
    "result_id" SERIAL NOT NULL,
    "scan_id" INTEGER NOT NULL,
    "predicted_disease_id" INTEGER,
    "final_disease_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decision" VARCHAR(50),
    "ai_confidence" DOUBLE PRECISION,
    "diagnostic_status" "DiagnosticStatus" NOT NULL DEFAULT 'DISEASE',

    CONSTRAINT "DiagnosisResult_pkey" PRIMARY KEY ("result_id")
);

-- CreateTable
CREATE TABLE "FeedbackLog" (
    "feedback_id" SERIAL NOT NULL,
    "scan_id" INTEGER,
    "predicted_disease_id" INTEGER,
    "actual_disease_id" INTEGER,
    "is_correct" BOOLEAN,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diagnostic_status" "DiagnosticStatus" NOT NULL DEFAULT 'DISEASE',
    "role" "FeedbackRole" NOT NULL DEFAULT 'USER',

    CONSTRAINT "FeedbackLog_pkey" PRIMARY KEY ("feedback_id")
);

-- CreateTable
CREATE TABLE "SkinDiary" (
    "diary_id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "scan_id" INTEGER,
    "condition_score" INTEGER,
    "symptoms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkinDiary_pkey" PRIMARY KEY ("diary_id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "otp_id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "type" "OtpType" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("otp_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_username_key" ON "Account"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_account_id_key" ON "Patient"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "Disease_code_key" ON "Disease"("code");

-- CreateIndex
CREATE INDEX "SkinScan_patient_id_idx" ON "SkinScan"("patient_id");

-- CreateIndex
CREATE INDEX "Prediction_scan_id_idx" ON "Prediction"("scan_id");

-- CreateIndex
CREATE INDEX "Prediction_confidence_idx" ON "Prediction"("confidence");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosisResult_scan_id_key" ON "DiagnosisResult"("scan_id");

-- CreateIndex
CREATE INDEX "FeedbackLog_scan_id_idx" ON "FeedbackLog"("scan_id");

-- CreateIndex
CREATE INDEX "OtpCode_email_type_idx" ON "OtpCode"("email", "type");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiseaseImage" ADD CONSTRAINT "DiseaseImage_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "Disease"("disease_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiseaseImage" ADD CONSTRAINT "DiseaseImage_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "SkinScan"("scan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiseaseAdvice" ADD CONSTRAINT "DiseaseAdvice_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "Disease"("disease_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkinScan" ADD CONSTRAINT "SkinScan_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("patient_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanImage" ADD CONSTRAINT "ScanImage_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "SkinScan"("scan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "Disease"("disease_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "SkinScan"("scan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisResult" ADD CONSTRAINT "DiagnosisResult_final_disease_id_fkey" FOREIGN KEY ("final_disease_id") REFERENCES "Disease"("disease_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisResult" ADD CONSTRAINT "DiagnosisResult_predicted_disease_id_fkey" FOREIGN KEY ("predicted_disease_id") REFERENCES "Disease"("disease_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisResult" ADD CONSTRAINT "DiagnosisResult_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "SkinScan"("scan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackLog" ADD CONSTRAINT "FeedbackLog_actual_disease_id_fkey" FOREIGN KEY ("actual_disease_id") REFERENCES "Disease"("disease_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackLog" ADD CONSTRAINT "FeedbackLog_predicted_disease_id_fkey" FOREIGN KEY ("predicted_disease_id") REFERENCES "Disease"("disease_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackLog" ADD CONSTRAINT "FeedbackLog_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "SkinScan"("scan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkinDiary" ADD CONSTRAINT "SkinDiary_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("patient_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkinDiary" ADD CONSTRAINT "SkinDiary_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "SkinScan"("scan_id") ON DELETE CASCADE ON UPDATE CASCADE;
