/**
 * Generate lifestyle description prompt
 */
export function generateLifestylePrompt(
  annualBudget: number,
  location: string,
  housingStatus: string,
  healthcarePhase: string,
  maritalStatus: string
): string {
  const budgetLevel = annualBudget < 40000 ? 'frugal' : 
                     annualBudget < 70000 ? 'comfortable' : 'luxury';

  return `You are a retirement lifestyle advisor. Given the following financial profile, generate a vivid 2-3 paragraph description of what retirement life could look like.

FINANCIAL PROFILE:
- Annual retirement budget: $${annualBudget.toLocaleString()}
- Location: ${location}
- Housing: ${housingStatus}
- Healthcare stage: ${healthcarePhase}
- Marital status: ${maritalStatus}
- Budget level: ${budgetLevel}

OUTPUT FORMAT:
Paragraph 1: Housing situation and daily living
Paragraph 2: Lifestyle, dining, entertainment, travel
Paragraph 3: Overall financial comfort level and flexibility

RULES:
- Be encouraging but realistic
- Avoid specific dollar amounts in narrative
- Include concrete examples (e.g., "dinner at local restaurants 2x/week")
- Mention 1-2 specific activities or places in ${location}
- Adjust tone based on budget level: ${budgetLevel}

Tone: Warm, professional, optimistic

Write the response now:`;
}

/**
 * Generate recommendations prompt
 */
export function generateRecommendationsPrompt(
  successProbability: number,
  annualShortfall: number,
  retirementAge: number,
  portfolioAllocation: string,
  withdrawalRate: number
): string {
  return `Analyze this retirement scenario and provide 3-5 actionable recommendations to improve outcomes. Rank by impact (high/medium/low).

SCENARIO DATA:
- Current success probability: ${(successProbability * 100).toFixed(1)}%
- Annual shortfall risk: $${annualShortfall.toLocaleString()}
- Retirement age: ${retirementAge}
- Portfolio allocation: ${portfolioAllocation}
- Withdrawal rate: ${(withdrawalRate * 100).toFixed(1)}%

RECOMMENDATION CATEGORIES:
1. Savings rate adjustments
2. Retirement age changes
3. Expense optimization
4. Income strategy (part-time work, rental income)
5. Withdrawal sequencing
6. Location considerations

OUTPUT FORMAT (JSON):
{
  "recommendations": [
    {
      "title": "Brief title",
      "description": "Detailed explanation",
      "impact": "high|medium|low",
      "estimatedImprovement": "X% increase in success probability",
      "actionSteps": ["Step 1", "Step 2"],
      "tradeOffs": ["Trade-off 1"]
    }
  ]
}

Provide the JSON response now:`;
}

/**
 * Generate insights prompt
 */
export function generateInsightsPrompt(
  scenarioData: {
    nestEgg: number;
    annualExpenses: number;
    retirementAge: number;
    socialSecurityAge?: number;
    healthcareDropAge?: number;
  }
): string {
  return `Given this retirement scenario, generate 2-3 personalized insights that would be valuable to the user.

SCENARIO:
- Nest egg: $${scenarioData.nestEgg.toLocaleString()}
- Annual expenses: $${scenarioData.annualExpenses.toLocaleString()}
- Retirement age: ${scenarioData.retirementAge}
- Social Security start: ${scenarioData.socialSecurityAge || 'Not specified'}
- Medicare starts at: ${scenarioData.healthcareDropAge || 65}

Generate insights about:
1. Key milestone (Social Security, Medicare, RMDs)
2. Withdrawal rate assessment
3. Any interesting pattern or optimization opportunity

Format as a list of 2-3 concise insights. Each should be 1-2 sentences.

Generate insights now:`;
}
