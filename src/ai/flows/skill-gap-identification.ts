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
  missingSkills: z.array(z.string()).describe('A list of the top 3-5 most critical missing skills for a generalist tech role (e.g., Software Engineer, DevOps).'),
  learningPlan: z.string().describe('A structured, personalized 4-week learning plan in Markdown format. Each week should have a clear focus and include links to high-quality resources like articles, tutorials, or documentation.'),
});
export type SkillGapIdentificationOutput = z.infer<typeof SkillGapIdentificationOutputSchema>;

export async function skillGapIdentification(input: SkillGapIdentificationInput): Promise<SkillGapIdentificationOutput> {
  return skillGapIdentificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'skillGapIdentificationPrompt',
  input: {schema: SkillGapIdentificationInputSchema},
  output: {schema: SkillGapIdentificationOutputSchema},
  prompt: `You are an expert career advisor and technical recruiter for the tech industry.

Analyze the resume text provided below to identify critical missing skills for a mid-level technical role (like Software Engineer or DevOps Engineer).

Resume Text:
{{{resumeText}}}

Based on your analysis:
1.  Identify the top 3-5 most impactful missing skills.
2.  Generate a personalized, actionable 4-week learning plan in Markdown format.
3.  The plan should be structured weekly, with clear goals for each week.
4.  For each skill, provide links to 1-2 high-quality, free online resources (e.g., official documentation, popular tutorials, in-depth articles).

Return a list of the missing skills and the detailed learning plan.
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
