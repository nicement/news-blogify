
'use server';

/**
 * @fileOverview This flow generates a blog post draft based on the content of a given news article URL.
 * It first generates a mock "original article text" based on the keyword/title,
 * then uses that generated text to create the blog draft.
 *
 * - generateBlogDraft - A function that generates a blog draft based on the article URL and keyword.
 * - GenerateBlogDraftInput - The input type for the generateBlogDraft function.
 * - GenerateBlogDraftOutput - The return type for the generateBlogDraft function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBlogDraftInputSchema = z.object({
  keyword: z.string().describe('The keyword or article title to base the mock article and blog draft on.'),
  articleUrl: z.string().url().describe('The URL of the news article (used for context, actual content is mocked).'),
});
export type GenerateBlogDraftInput = z.infer<typeof GenerateBlogDraftInputSchema>;

const GenerateBlogDraftOutputSchema = z.object({
  draft: z.string().describe('The generated blog draft based on the mocked article content.'),
  sourceArticleTitle: z.string().describe('The title used or derived for the source article.'),
  mockArticleContent: z.string().describe('The generated mock article content used as a basis for the draft.')
});
export type GenerateBlogDraftOutput = z.infer<typeof GenerateBlogDraftOutputSchema>;

export async function generateBlogDraft(input: GenerateBlogDraftInput): Promise<GenerateBlogDraftOutput> {
  return generateBlogDraftFlow(input);
}

const generateMockArticlePrompt = ai.definePrompt({
  name: 'generateMockArticlePrompt',
  input: { schema: GenerateBlogDraftInputSchema.pick({ keyword: true }) },
  output: { schema: z.object({
    mockArticleContent: z.string().describe('A realistic-sounding, detailed news article body text in Korean, based on the provided keyword/title. This should read like the original source text from which the keyword was extracted.'),
    retrievedArticleTitle: z.string().describe('The article title, confirmed or refined based on the keyword.')
  })},
  prompt: `주어진 키워드/기사 제목을 바탕으로, 해당 키워드가 추출되었을 법한 원본 뉴스 기사 본문 내용을 한국어로 상세하고 사실적으로 작성해주세요. 독자가 실제 기사를 읽는 것처럼 느껴지도록 해야 합니다.

뉴스 기사 제목/키워드: {{{keyword}}}

생성된 기사 본문 (한국어):
`,
});


const generateBlogDraftPrompt = ai.definePrompt({
  name: 'generateBlogDraftPrompt',
  input: {schema: z.object({
    retrievedArticleTitle: z.string().describe('The title of the news article used as a source.'),
    articleContent: z.string().describe('The full text content of the news article to base the blog post on.'),
  })},
  output: {schema: GenerateBlogDraftOutputSchema.pick({ draft: true })},
  prompt: `다음은 "{{{retrievedArticleTitle}}}"라는 제목의 뉴스 기사 원문입니다. 이 내용을 바탕으로, 독자들이 흥미를 느낄 만한 블로그 게시물 초안을 한국어로 작성해주세요. 기사의 핵심 내용을 잘 반영하되, 블로그 형식에 맞게 자연스럽게 재구성하고, 서론, 본론, 결론의 구조를 갖추도록 합니다.

뉴스 기사 원문 내용:
{{{articleContent}}}

블로그 초안 (마크다운 형식, 한국어):
`,
});

const generateBlogDraftFlow = ai.defineFlow(
  {
    name: 'generateBlogDraftFlow',
    inputSchema: GenerateBlogDraftInputSchema,
    outputSchema: GenerateBlogDraftOutputSchema,
  },
  async (input) => {
    console.log(`Generating mock article and blog draft for keyword: ${input.keyword} (URL: ${input.articleUrl})`);

    // Step 1: Generate mock article content based on the keyword
    const mockArticleResponse = await generateMockArticlePrompt({ keyword: input.keyword });
    
    if (!mockArticleResponse.output?.mockArticleContent || !mockArticleResponse.output?.retrievedArticleTitle) {
      throw new Error('Failed to generate mock article content.');
    }
    const { mockArticleContent, retrievedArticleTitle } = mockArticleResponse.output;

    console.log(`Generated mock article title: ${retrievedArticleTitle}`);
    // console.log(`Generated mock article content (first 100 chars): ${mockArticleContent.substring(0,100)}...`);


    // Step 2: Generate blog draft based on the mock article content
    const blogDraftResponse = await generateBlogDraftPrompt({
      retrievedArticleTitle: retrievedArticleTitle,
      articleContent: mockArticleContent,
    });
    
    if (!blogDraftResponse.output?.draft) {
        throw new Error('Failed to generate blog draft from the mock article.');
    }

    return {
        draft: blogDraftResponse.output.draft,
        sourceArticleTitle: retrievedArticleTitle,
        mockArticleContent: mockArticleContent, // Also returning the mock article for transparency if needed
    };
  }
);
