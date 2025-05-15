'use server';

/**
 * @fileOverview This flow generates a blog post draft based on a given keyword.
 *
 * - generateBlogDraft - A function that generates a blog draft based on the keyword.
 * - GenerateBlogDraftInput - The input type for the generateBlogDraft function.
 * - GenerateBlogDraftOutput - The return type for the generateBlogDraft function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBlogDraftInputSchema = z.object({
  keyword: z.string().describe('The keyword for which to generate the blog draft.'),
});
export type GenerateBlogDraftInput = z.infer<typeof GenerateBlogDraftInputSchema>;

const GenerateBlogDraftOutputSchema = z.object({
  draft: z.string().describe('The generated blog draft.'),
});
export type GenerateBlogDraftOutput = z.infer<typeof GenerateBlogDraftOutputSchema>;

export async function generateBlogDraft(input: GenerateBlogDraftInput): Promise<GenerateBlogDraftOutput> {
  return generateBlogDraftFlow(input);
}

const generateBlogDraftPrompt = ai.definePrompt({
  name: 'generateBlogDraftPrompt',
  input: {schema: GenerateBlogDraftInputSchema},
  output: {schema: GenerateBlogDraftOutputSchema},
  prompt: `You are an expert blog writer. Please generate a blog post draft based on the following keyword: {{{keyword}}}. The blog post should be well-structured and engaging.`, 
});

const generateBlogDraftFlow = ai.defineFlow(
  {
    name: 'generateBlogDraftFlow',
    inputSchema: GenerateBlogDraftInputSchema,
    outputSchema: GenerateBlogDraftOutputSchema,
  },
  async input => {
    const {output} = await generateBlogDraftPrompt(input);
    return output!;
  }
);
