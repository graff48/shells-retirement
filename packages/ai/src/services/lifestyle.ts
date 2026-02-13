import { generateWithClaude, streamWithClaude } from '../client';
import { generateLifestylePrompt } from '../prompts/lifestyle';

export interface LifestyleInputs {
  annualBudget: number;
  location: string;
  housingStatus: string;
  healthcarePhase: string;
  maritalStatus: string;
}

export async function generateLifestyleDescription(
  inputs: LifestyleInputs
): Promise<{ content: string; success: boolean; error?: string }> {
  const prompt = generateLifestylePrompt(
    inputs.annualBudget,
    inputs.location,
    inputs.housingStatus,
    inputs.healthcarePhase,
    inputs.maritalStatus
  );

  return generateWithClaude(prompt, 800);
}

export async function* streamLifestyleDescription(
  inputs: LifestyleInputs
): AsyncGenerator<string, void, unknown> {
  const prompt = generateLifestylePrompt(
    inputs.annualBudget,
    inputs.location,
    inputs.housingStatus,
    inputs.healthcarePhase,
    inputs.maritalStatus
  );

  yield* streamWithClaude(prompt, 800);
}

/**
 * Fallback template for when AI is unavailable
 */
export function generateLifestyleFallback(inputs: LifestyleInputs): string {
  const { annualBudget, location, housingStatus } = inputs;
  
  const budgetLevel = annualBudget < 40000 ? 'modest' : 
                     annualBudget < 70000 ? 'comfortable' : 'affluent';
  
  return `Your ${budgetLevel} retirement lifestyle in ${location}...

**Housing & Daily Life**
With your ${housingStatus} situation in ${location}, you'll enjoy a ${budgetLevel} standard of living. Your days can be structured around local amenities and community activities.

**Lifestyle & Activities**
You should be able to enjoy regular dining out, local entertainment, and occasional travel. The ${location} area offers various recreational opportunities suitable for your budget level.

**Financial Comfort**
Your retirement plan suggests ${budgetLevel === 'modest' ? 'careful budgeting with some flexibility' : budgetLevel === 'comfortable' ? 'a good balance of security and enjoyment' : 'significant financial freedom'}.

*Note: This is a template response. Connect to AI for a personalized lifestyle description.*`;
}
