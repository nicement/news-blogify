'use server';
/**
 * @fileOverview Elaborates on a draft blog post using the Gemini API.
 *
 * - elaborateBlogContent - A function that takes a draft blog post and elaborates on it.
 * - ElaborateBlogContentInput - The input type for the elaborateBlogContent function.
 * - ElaborateBlogContentOutput - The return type for the elaborateBlogContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ElaborateBlogContentInputSchema = z.object({
  draft: z.string().describe('The draft blog post to elaborate on.'),
});
export type ElaborateBlogContentInput = z.infer<typeof ElaborateBlogContentInputSchema>;

const ElaborateBlogContentOutputSchema = z.object({
  elaboratedContent: z.string().describe('The elaborated blog post content.'),
});
export type ElaborateBlogContentOutput = z.infer<typeof ElaborateBlogContentOutputSchema>;

export async function elaborateBlogContent(input: ElaborateBlogContentInput): Promise<ElaborateBlogContentOutput> {
  return elaborateBlogContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'elaborateBlogContentPrompt',
  input: {schema: ElaborateBlogContentInputSchema},
  output: {schema: ElaborateBlogContentOutputSchema},
  prompt: `You are an expert blog writer. Please elaborate on the following draft blog post in Korean to make it more detailed and engaging:\n\n{{{draft}}}`,
});

const elaborateBlogContentFlow = ai.defineFlow(
  {
    name: 'elaborateBlogContentFlow',
    inputSchema: ElaborateBlogContentInputSchema,
    outputSchema: ElaborateBlogContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
