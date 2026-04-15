-- CreateTable
CREATE TABLE "Account" (
    "account_id" SERIAL NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "role" VARCHAR(20) DEFAULT 'patient',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "patient_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "full_name" VARCHAR(100),
    "age" INTEGER,
    "gender" VARCHAR(10),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("patient_id")
);

-- CreateTable
CREATE TABLE "Disease" (
    "disease_id" SERIAL NOT NULL,
    "name" VARCHAR(100),
    "description" TEXT,
    "visual_pattern" VARCHAR(100),
    "color_pattern" VARCHAR(100),
    "border_type" VARCHAR(100),
    "is_contagious" BOOLEAN,

    CONSTRAINT "Disease_pkey" PRIMARY KEY ("disease_id")
);

-- CreateTable
CREATE TABLE "DiseaseImage" (
    "image_id" SERIAL NOT NULL,
    "disease_id" INTEGER,
    "image_url" TEXT,
    "source" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiseaseImage_pkey" PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "DiagnosticQuestion" (
    "question_id" SERIAL NOT NULL,
    "question_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticQuestion_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "DiseaseRule" (
    "rule_id" SERIAL NOT NULL,
    "disease_id" INTEGER,
    "question_id" INTEGER,
    "expected_answer" BOOLEAN,
    "weight" DOUBLE PRECISION,

    CONSTRAINT "DiseaseRule_pkey" PRIMARY KEY ("rule_id")
);

-- CreateTable
CREATE TABLE "DiseaseAdvice" (
    "advice_id" SERIAL NOT NULL,
    "disease_id" INTEGER,
    "advice_type" VARCHAR(20),
    "title" VARCHAR(255),
    "content" TEXT,
    "priority" INTEGER,

    CONSTRAINT "DiseaseAdvice_pkey" PRIMARY KEY ("advice_id")
);

-- CreateTable
CREATE TABLE "EmergencyRule" (
    "emergency_id" SERIAL NOT NULL,
    "condition_text" TEXT,
    "is_active" BOOLEAN,

    CONSTRAINT "EmergencyRule_pkey" PRIMARY KEY ("emergency_id")
);

-- CreateTable
CREATE TABLE "SkinScan" (
    "scan_id" SERIAL NOT NULL,
    "patient_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkinScan_pkey" PRIMARY KEY ("scan_id")
);

-- CreateTable
CREATE TABLE "ScanImage" (
    "image_id" SERIAL NOT NULL,
    "scan_id" INTEGER,
    "image_url" TEXT,
    "angle" VARCHAR(50),
    "is_blurry" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanImage_pkey" PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "prediction_id" SERIAL NOT NULL,
    "scan_id" INTEGER,
    "disease_id" INTEGER,
    "confidence" DOUBLE PRECISION,
    "model_version" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("prediction_id")
);

-- CreateTable
CREATE TABLE "DiagnosisResult" (
    "result_id" SERIAL NOT NULL,
    "scan_id" INTEGER NOT NULL,
    "predicted_disease_id" INTEGER,
    "final_disease_id" INTEGER,
    "is_emergency" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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

    CONSTRAINT "FeedbackLog_pkey" PRIMARY KEY ("feedback_id")
);

-- CreateTable
CREATE TABLE "SkinDiary" (
    "diary_id" SERIAL NOT NULL,
    "patient_id" INTEGER,
    "scan_id" INTEGER,
    "condition_score" INTEGER,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkinDiary_pkey" PRIMARY KEY ("diary_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_username_key" ON "Account"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_account_id_key" ON "Patient"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosisResult_scan_id_key" ON "DiagnosisResult"("scan_id");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiseaseImage" ADD CONSTRAINT "DiseaseImage_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "Disease"("disease_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiseaseRule" ADD CONSTRAINT "DiseaseRule_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "Disease"("disease_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiseaseRule" ADD CONSTRAINT "DiseaseRule_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "DiagnosticQuestion"("question_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiseaseAdvice" ADD CONSTRAINT "DiseaseAdvice_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "Disease"("disease_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkinScan" ADD CONSTRAINT "SkinScan_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("patient_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanImage" ADD CONSTRAINT "ScanImage_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "SkinScan"("scan_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "SkinScan"("scan_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "Disease"("disease_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisResult" ADD CONSTRAINT "DiagnosisResult_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "SkinScan"("scan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisResult" ADD CONSTRAINT "DiagnosisResult_predicted_disease_id_fkey" FOREIGN KEY ("predicted_disease_id") REFERENCES "Disease"("disease_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisResult" ADD CONSTRAINT "DiagnosisResult_final_disease_id_fkey" FOREIGN KEY ("final_disease_id") REFERENCES "Disease"("disease_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackLog" ADD CONSTRAINT "FeedbackLog_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "SkinScan"("scan_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackLog" ADD CONSTRAINT "FeedbackLog_predicted_disease_id_fkey" FOREIGN KEY ("predicted_disease_id") REFERENCES "Disease"("disease_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackLog" ADD CONSTRAINT "FeedbackLog_actual_disease_id_fkey" FOREIGN KEY ("actual_disease_id") REFERENCES "Disease"("disease_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkinDiary" ADD CONSTRAINT "SkinDiary_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("patient_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkinDiary" ADD CONSTRAINT "SkinDiary_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "SkinScan"("scan_id") ON DELETE SET NULL ON UPDATE CASCADE;
