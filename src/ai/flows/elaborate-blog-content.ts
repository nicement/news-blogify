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
**치환되어야 하는 내용은 생성하지 말고 사실 기반으로 작성해 주세요.**
**외부 기사나 인물의 언급된 내용을 인용할 경우에는 인용할 문장이 포함된 실제 URL을 포함하여 인용해 주세요.**
**각 문단은 명확한 주제를 가지고 있어야 하며, 독자가 쉽게 이해할 수 있도록 구성되어야 합니다.**
**전문 용어는 설명을 덧붙여 주세요.**
**독자의 관심을 끌 수 있는 서론과 결론을 포함해 주세요.**
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
