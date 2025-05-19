
"use server";
/**
 * @fileOverview Generates a blog post draft based on user-provided custom keywords.
 *
 * - generateBlogFromCustomKeywords - Main function to generate draft and title.
 * - GenerateBlogFromCustomKeywordsInput - Input type.
 * - GenerateBlogFromCustomKeywordsOutput - Output type.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const GenerateBlogFromCustomKeywordsInputSchema = z.object({
  customKeywords: z
    .string()
    .min(1, "키워드를 입력해주세요.")
    .describe("User-provided keywords for the blog post."),
});
export type GenerateBlogFromCustomKeywordsInput = z.infer<
  typeof GenerateBlogFromCustomKeywordsInputSchema
>;

const GenerateBlogFromCustomKeywordsOutputSchema = z.object({
  draft: z.string().describe("The generated blog draft in Markdown format."),
  generatedTitle: z
    .string()
    .describe("A title generated based on the keywords."),
});
export type GenerateBlogFromCustomKeywordsOutput = z.infer<
  typeof GenerateBlogFromCustomKeywordsOutputSchema
>;

export async function generateBlogFromCustomKeywords(
  input: GenerateBlogFromCustomKeywordsInput
): Promise<GenerateBlogFromCustomKeywordsOutput> {
  return generateBlogFromCustomKeywordsFlow(input);
}

const generateBlogTitleFromCustomKeywordsPrompt = ai.definePrompt({
  name: "generateBlogTitleFromCustomKeywordsPrompt",
  input: { schema: GenerateBlogFromCustomKeywordsInputSchema },
  output: { schema: z.object({ blogTitle: z.string() }) },
  prompt: `사용자가 제공한 다음 키워드를 기반으로 SEO 친화적이고 독자의 관심을 끌 만한 한국어 블로그 게시물 제목을 1개 생성해주세요. 제목은 주요 키워드를 포함하고 간결해야 합니다.

키워드:
{{{customKeywords}}}

블로그 제목 (한국어):
`,
});

const generateContentBaseFromCustomKeywordsPrompt = ai.definePrompt({
  name: "generateContentBaseFromCustomKeywordsPrompt",
  input: {
    schema: z.object({
      customKeywords: z.string(),
      blogTitle: z.string(),
    }),
  },
  output: { schema: z.object({ contentBase: z.string() }) },
  prompt: `다음 키워드 "{{{customKeywords}}}"와 블로그 제목 "{{{blogTitle}}}"을 사용하여 블로그 게시물의 기초가 될 수 있는 상세하고 일관성 있는 한국어 문단을 1~2개 작성해주세요. 이 내용은 추후 블로그 초안 작성에 사용됩니다. 사실에 기반하고, 독자가 이해하기 쉽게 작성해주세요.

키워드: {{{customKeywords}}}
블로그 제목: {{{blogTitle}}}

기초 내용 (한국어):
`,
});

const generateBlogDraftFromCustomContentPrompt = ai.definePrompt({
  name: "generateBlogDraftFromCustomContentPrompt",
  input: {
    schema: z.object({
      blogTitle: z.string(),
      contentBase: z.string(),
    }),
  },
  output: { schema: GenerateBlogFromCustomKeywordsOutputSchema.pick({ draft: true }) },
  prompt: `다음은 "{{{blogTitle}}}"라는 제목의 블로그 게시물을 위해 생성된 기초 내용입니다. 이 내용을 바탕으로 독자들이 흥미를 느낄만한 매력적인 한국어 블로그 게시물 초안을 마크다운 형식으로 작성해주세요. 서론, 본론, 결론의 구조를 갖추고, 각 문단은 명확한 주제를 전달해야 합니다. 자연스럽게 내용을 확장하고 다듬어주세요.

생성된 제목: {{{blogTitle}}}
기초 내용:
{{{contentBase}}}

블로그 초안 (마크다운 형식, 한국어):
`,
});

const generateBlogFromCustomKeywordsFlow = ai.defineFlow(
  {
    name: "generateBlogFromCustomKeywordsFlow",
    inputSchema: GenerateBlogFromCustomKeywordsInputSchema,
    outputSchema: GenerateBlogFromCustomKeywordsOutputSchema,
  },
  async (input) => {
    console.log(
      `Generating blog from custom keywords: ${input.customKeywords}`
    );

    // Step 1: Generate blog title
    const titleResponse = await generateBlogTitleFromCustomKeywordsPrompt(input);
    if (!titleResponse.output?.blogTitle) {
      throw new Error("Failed to generate blog title from custom keywords.");
    }
    const generatedTitle = titleResponse.output.blogTitle;
    console.log(`Generated title: ${generatedTitle}`);

    // Step 2: Generate content base
    const contentBaseResponse =
      await generateContentBaseFromCustomKeywordsPrompt({
        customKeywords: input.customKeywords,
        blogTitle: generatedTitle,
      });
    if (!contentBaseResponse.output?.contentBase) {
      throw new Error("Failed to generate content base from custom keywords.");
    }
    const contentBase = contentBaseResponse.output.contentBase;
    console.log(`Generated content base (first 100 chars): ${contentBase.substring(0,100)}`);


    // Step 3: Generate blog draft
    const draftResponse = await generateBlogDraftFromCustomContentPrompt({
      blogTitle: generatedTitle,
      contentBase: contentBase,
    });
    if (!draftResponse.output?.draft) {
      throw new Error("Failed to generate blog draft from custom content.");
    }
    console.log(`Generated draft (first 100 chars): ${draftResponse.output.draft.substring(0,100)}`);

    return {
      draft: draftResponse.output.draft,
      generatedTitle: generatedTitle,
    };
  }
);

