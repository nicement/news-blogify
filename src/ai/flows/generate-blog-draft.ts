"use server";

/**
 * @fileOverview This flow generates a blog post draft based on the content of a given news article URL.
 * It first generates a mock "original article text" based on the keyword/title,
 * then uses that generated text to create the blog draft.
 *
 * - generateBlogDraft - A function that generates a blog draft based on the article URL and keyword.
 * - GenerateBlogDraftInput - The input type for the generateBlogDraft function.
 * - GenerateBlogDraftOutput - The return type for the generateBlogDraft function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import axios from "axios";
import * as cheerio from "cheerio";

const GenerateBlogDraftInputSchema = z.object({
  keyword: z
    .string()
    .describe(
      "The keyword or article title to base the mock article and blog draft on."
    ),
  articleUrl: z
    .string()
    .url()
    .describe(
      "The URL of the news article (used for context, actual content is mocked)."
    ),
});
export type GenerateBlogDraftInput = z.infer<
  typeof GenerateBlogDraftInputSchema
>;

const GenerateBlogDraftOutputSchema = z.object({
  draft: z
    .string()
    .describe("The generated blog draft based on the mocked article content."),
  sourceArticleTitle: z
    .string()
    .describe("The title used or derived for the source article."),
  articleContent: z
    .string()
    .describe("The generated article content used as a basis for the draft."),
});
export type GenerateBlogDraftOutput = z.infer<
  typeof GenerateBlogDraftOutputSchema
>;

export async function generateBlogDraft(
  input: GenerateBlogDraftInput
): Promise<GenerateBlogDraftOutput> {
  return generateBlogDraftFlow(input);
}

const generateBlogDraftPrompt = ai.definePrompt({
  name: "generateBlogDraftPrompt",
  input: {
    schema: z.object({
      retrievedArticleTitle: z
        .string()
        .describe("The title of the news article used as a source."),
      articleContent: z
        .string()
        .describe(
          "The full text content of the news article to base the blog post on."
        ),
    }),
  },
  output: { schema: GenerateBlogDraftOutputSchema.pick({ draft: true }) },
  prompt: `다음은 "{{{retrievedArticleTitle}}}"라는 제목의 뉴스 기사 원문입니다. 이 내용을 바탕으로, 독자들이 흥미를 느낄 만한 블로그 게시물 초안을 한국어로 작성해주세요. 기사의 핵심 내용을 잘 반영하되, 블로그 형식에 맞게 자연스럽게 재구성하고, 서론, 본론, 결론의 구조를 갖추도록 합니다.

뉴스 기사 원문 내용:
{{{articleContent}}}

블로그 초안 (마크다운 형식, 한국어):
`,
});

const generateBlogTitlePrompt = ai.definePrompt({
  name: "generateBlogTitlePrompt",
  input: {
    schema: z.object({
      retrievedArticleTitle: z
        .string()
        .describe("The title of the news article used as a source."),
      articleContent: z
        .string()
        .describe(
          "The full text content of the news article to base the blog post on."
        ),
    }),
  },
  output: {
    schema: z.object({
      blogTitle: z
        .string()
        .describe(
          "A catchy, SEO-friendly blog post title based on the keyword."
        ),
    }),
  },
  prompt: `다음은 "{{{retrievedArticleTitle}}}"라는 제목의 뉴스 기사 원문입니다. 이 내용을 바탕으로, 독자들이 클릭하고 싶어하는 블로그 게시물 제목을 한국어로 작성해주세요. 제목은 SEO 친화적이고, 기사의 핵심 내용을 잘 반영해야 합니다.
뉴스 기사 원문 내용:
{{{articleContent}}}

블로그 게시물 제목 (한국어):
`,
});

const generateBlogDraftFlow = ai.defineFlow(
  {
    name: "generateBlogDraftFlow",
    inputSchema: GenerateBlogDraftInputSchema,
    outputSchema: GenerateBlogDraftOutputSchema,
  },
  async (input) => {
    console.log(
      `Generating blog draft for keyword: ${input.keyword} (URL: ${input.articleUrl})`
    );

    // Step 1: Get article content based on the artibleUrl
    let articleContent = "";
    try {
      const response = await axios.get(input.articleUrl);
      const html = response.data;
      const $ = cheerio.load(html);

      // 네이버 뉴스 본문 추출 (일반적인 selector, 필요시 맞춤 수정)
      const contentElement =
        $("#dic_area").text().trim() ||
        $(".news_end .article_body").text().trim() ||
        $("article").text().trim();

      articleContent = contentElement;
    } catch (error) {
      throw new Error(
        `Failed to fetch or parse article content from ${input.articleUrl}: ${error}`
      );
    }

    if (!articleContent) {
      throw new Error(
        `Failed to extract article content from ${input.articleUrl}`
      );
    }

    console.log(`articleContent: ${articleContent}`);
    // Step 2: Generate blog title based on the keyword
    const blogTitleResponse = await generateBlogTitlePrompt({
      retrievedArticleTitle: input.keyword,
      articleContent: articleContent,
    });
    if (!blogTitleResponse.output?.blogTitle) {
      throw new Error("Failed to generate blog title.");
    }
    const blogTitle = blogTitleResponse.output.blogTitle;

    // Step 3: Generate blog draft based on the article content
    const blogDraftResponse = await generateBlogDraftPrompt({
      retrievedArticleTitle: blogTitle,
      articleContent: articleContent,
    });

    if (!blogDraftResponse.output?.draft) {
      throw new Error("Failed to generate blog draft from the mock article.");
    }

    return {
      draft: blogDraftResponse.output.draft,
      sourceArticleTitle: blogTitle,
      articleContent: articleContent,
    };
  }
);
