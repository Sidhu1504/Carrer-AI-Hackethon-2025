'use server';

/**
 * @fileOverview A skill gap identification AI agent.
 *
 * - skillGapIdentification - A function that handles the skill gap identification process.
 * - SkillGapIdentificationInput - The input type for the skillGapIdentification function.
 * - SkillGapIdentificationOutput - The return type for the skillGapIdentification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SkillGapIdentificationInputSchema = z.object({
  resumeText: z
    .string()
    .describe(
      'The text content of the resume.'
    ),
});
export type SkillGapIdentificationInput = z.infer<typeof SkillGapIdentificationInputSchema>;

const SkillGapIdentificationOutputSchema = z.object({
  missingSkills: z.array(z.string()).describe('List of missing skills.'),
  learningPlan: z.string().describe('A personalized 4-week learning plan.'),
});
export type SkillGapIdentificationOutput = z.infer<typeof SkillGapIdentificationOutputSchema>;

export async function skillGapIdentification(input: SkillGapIdentificationInput): Promise<SkillGapIdentificationOutput> {
  return skillGapIdentificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'skillGapIdentificationPrompt',
  input: {schema: SkillGapIdentificationInputSchema},
  output: {schema: SkillGapIdentificationOutputSchema},
  prompt: `You are an expert career advisor. Analyze the resume text provided and identify missing skills that would be beneficial for the candidate.

Resume Text: {{{resumeText}}}

Based on the identified missing skills, generate a personalized 4-week learning plan to acquire those skills. Return a list of missing skills and the learning plan.

Make sure the learning plan is actionable and includes specific resources for learning.
`, 
});

const skillGapIdentificationFlow = ai.defineFlow(
  {
    name: 'skillGapIdentificationFlow',
    inputSchema: SkillGapIdentificationInputSchema,
    outputSchema: SkillGapIdentificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
