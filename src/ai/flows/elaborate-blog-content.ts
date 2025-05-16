"use server";
/**
 * @fileOverview Elaborates on a draft blog post using the Gemini API.
 *
 * - elaborateBlogContent - A function that takes a draft blog post and elaborates on it.
 * - ElaborateBlogContentInput - The input type for the elaborateBlogContent function.
 * - ElaborateBlogContentOutput - The return type for the elaborateBlogContent function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const ElaborateBlogContentInputSchema = z.object({
  draft: z.string().describe("The draft blog post to elaborate on."),
});
export type ElaborateBlogContentInput = z.infer<
  typeof ElaborateBlogContentInputSchema
>;

const ElaborateBlogContentOutputSchema = z.object({
  elaboratedContent: z.string().describe("The elaborated blog post content."),
});
export type ElaborateBlogContentOutput = z.infer<
  typeof ElaborateBlogContentOutputSchema
>;

export async function elaborateBlogContent(
  input: ElaborateBlogContentInput
): Promise<ElaborateBlogContentOutput> {
  return elaborateBlogContentFlow(input);
}

const prompt = ai.definePrompt({
  name: "elaborateBlogContentPrompt",
  input: { schema: ElaborateBlogContentInputSchema },
  output: { schema: ElaborateBlogContentOutputSchema },
  prompt: `당신은 전문 블로그 작가입니다. 아래 초고 블로그 게시물을 한국어로 더욱 상세하고, 흥미롭고, 구조화된 형태로 다듬어 주세요. 적절한 부분에 깊이, 예시 또는 설명을 추가하여 초고의 핵심 메시지를 유지하면서 풍부하게 만들어 주세요.

**결과물은 반드시 한국어로 작성하며, 가독성을 높이기 위해 각 문장 또는 의미 단위로 줄바꿈을 명확하게 적용해 주세요.**


Draft Blog Post:
{{{draft}}}

Elaborated Blog Post (Markdown, Korean):
`,
});

const elaborateBlogContentFlow = ai.defineFlow(
  {
    name: "elaborateBlogContentFlow",
    inputSchema: ElaborateBlogContentInputSchema,
    outputSchema: ElaborateBlogContentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
