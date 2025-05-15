
'use server';

/**
 * @fileOverview This flow generates a blog post draft based on a given keyword.
 * It first generates a mock news article related to the keyword,
 * then uses that article to create the blog draft.
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

const MockArticleOutputSchema = z.object({
  articleContent: z.string().describe('A mock news article summary based on the keyword.'),
});

const GenerateBlogDraftOutputSchema = z.object({
  draft: z.string().describe('The generated blog draft based on the article.'),
});
export type GenerateBlogDraftOutput = z.infer<typeof GenerateBlogDraftOutputSchema>;

export async function generateBlogDraft(input: GenerateBlogDraftInput): Promise<GenerateBlogDraftOutput> {
  return generateBlogDraftFlow(input);
}

const generateMockArticlePrompt = ai.definePrompt({
  name: 'generateMockArticlePrompt',
  input: {schema: GenerateBlogDraftInputSchema},
  output: {schema: MockArticleOutputSchema},
  prompt: `키워드 "{{keyword}}"와 관련된 짧은 뉴스 기사 요약문을 한국어로 작성해주세요. 이 요약문은 블로그 게시물 작성의 기초 자료로 사용될 것입니다. 사실에 기반한 것처럼 보이게 작성해주세요.`,
});

const generateBlogDraftPrompt = ai.definePrompt({
  name: 'generateBlogDraftPrompt',
  input: {schema: z.object({
    keyword: z.string().describe('The original keyword for context.'),
    articleContent: z.string().describe('The content of the news article to base the blog post on.'),
  })},
  output: {schema: GenerateBlogDraftOutputSchema},
  prompt: `다음 뉴스 기사 내용과 키워드를 바탕으로 잘 구조화되고 흥미로운 블로그 게시물 초안을 한국어로 작성해주세요:

키워드: {{{keyword}}}

뉴스 기사 내용:
{{{articleContent}}}

블로그 초안:
`,
});

const generateBlogDraftFlow = ai.defineFlow(
  {
    name: 'generateBlogDraftFlow',
    inputSchema: GenerateBlogDraftInputSchema,
    outputSchema: GenerateBlogDraftOutputSchema,
  },
  async (input) => {
    // Step 1: Generate a mock news article based on the keyword
    const mockArticleResponse = await generateMockArticlePrompt(input);
    const articleContent = mockArticleResponse.output?.articleContent;

    if (!articleContent) {
      throw new Error('Failed to generate mock article content.');
    }

    // Step 2: Generate the blog draft based on the mock article and keyword
    const blogDraftResponse = await generateBlogDraftPrompt({
      keyword: input.keyword,
      articleContent: articleContent,
    });
    
    return blogDraftResponse.output!;
  }
);
