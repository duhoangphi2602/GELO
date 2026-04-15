import { Injectable, Logger } from '@nestjs/common';

export interface AnswerInput {
  questionId: number;
  answer: string; // 'Yes' | 'No' | 'Unknown' / 'Unsure'
}

export interface RuleWithQuestion {
  questionId: number | null;
  expectedAnswer: boolean | null;
  weight: number | null;
  question: {
    isEmergency: boolean | null;
  } | null;
}

@Injectable()
export class DiagnosticEngineService {
  private readonly logger = new Logger(DiagnosticEngineService.name);

  public calculateHybridScore(
    aiScore: number,
    answers: AnswerInput[],
    rules: RuleWithQuestion[]
  ) {
    // Current mapping: Rule=100%, AI=0% (Configurable via env)
    const AI_WEIGHT = Number(process.env.AI_WEIGHT || 0.0);
    const RULE_WEIGHT = Number(process.env.RULE_WEIGHT || 1.0);

    let ruleScore = 0;
    let maxRuleScore = 0;
    let isEmergency = false;
    const ruleLogs: any[] = [];

    this.logger.log(`Evaluating ${rules.length} rules against ${answers?.length || 0} answers`);

    for (const rule of rules) {
      if (!rule.questionId) continue;

      const userAns = answers?.find(a => a.questionId === rule.questionId);
      const expectedAnsStr = rule.expectedAnswer ? 'Yes' : 'No';
      const maximumPoints = rule.weight || 0;
      
      const pAnswer = userAns ? userAns.answer : 'Unknown';
      const isMatch = pAnswer === expectedAnsStr;

      if (isMatch && rule.question?.isEmergency) {
        isEmergency = true;
      }

      const scoreContribution = isMatch ? maximumPoints : 0;
      ruleScore += scoreContribution;
      maxRuleScore += maximumPoints;

      ruleLogs.push({
        questionId: rule.questionId,
        patientAnswer: pAnswer.substring(0, 20), // VarChar(20) limit
        expectedAnswer: rule.expectedAnswer,
        isMatch: isMatch,
        weight: maximumPoints,
        scoreContribution: scoreContribution
      });
    }

    const normalizedRuleScore = maxRuleScore > 0 ? (ruleScore / maxRuleScore) * 100 : 0;
    const finalScore = (aiScore * 100 * AI_WEIGHT) + (normalizedRuleScore * RULE_WEIGHT);

    let decision = 'unknown';
    if (isEmergency) {
      decision = 'emergency';
    } else if (finalScore >= 70) {
      decision = 'positive';
    } else if (finalScore >= 50) {
      decision = 'uncertain';
    }

    return {
      ruleScore,
      maxRuleScore,
      normalizedScore: finalScore,
      decision,
      ruleLogs,
      isEmergency
    };
  }
}
