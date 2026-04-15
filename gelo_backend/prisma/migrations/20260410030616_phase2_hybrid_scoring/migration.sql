-- AlterTable
ALTER TABLE "DiagnosisResult" ADD COLUMN     "decision" VARCHAR(50),
ADD COLUMN     "max_rule_score" DOUBLE PRECISION,
ADD COLUMN     "normalized_score" DOUBLE PRECISION,
ADD COLUMN     "rule_score" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "DiagnosticQuestion" ADD COLUMN     "is_emergency" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "RuleScoreLog" (
    "log_id" SERIAL NOT NULL,
    "scan_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "patient_answer" VARCHAR(20) NOT NULL,
    "expected_answer" BOOLEAN,
    "is_match" BOOLEAN NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "score_contribution" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleScoreLog_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE INDEX "RuleScoreLog_scan_id_idx" ON "RuleScoreLog"("scan_id");

-- AddForeignKey
ALTER TABLE "RuleScoreLog" ADD CONSTRAINT "RuleScoreLog_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "SkinScan"("scan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleScoreLog" ADD CONSTRAINT "RuleScoreLog_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "DiagnosticQuestion"("question_id") ON DELETE RESTRICT ON UPDATE CASCADE;
