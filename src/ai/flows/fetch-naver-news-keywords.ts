"use server";
/**
 * @fileOverview Fetches trending news keywords and their URLs from Naver News.
 * IMPORTANT: This file contains placeholder logic for web scraping.
 * The actual scraping implementation (using libraries like axios and cheerio)
 * needs to be added by the user after installing them.
 *
 * - fetchNaverNewsKeywords - Fetches news keywords and URLs.
 * - NaverNewsKeywordItem - The type for a single fetched keyword item.
 * - FetchNaverNewsKeywordsOutput - The return type for the fetchNaverNewsKeywords function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const NAVER_NEWS_RANKING_URL =
  "https://news.naver.com/main/ranking/popularDay.naver";

const NaverNewsKeywordItemSchema = z.object({
  rank: z.number().describe("The rank of the news keyword."),
  keyword: z.string().describe("The news keyword (article title)."),
  articleUrl: z.string().url().describe("The URL of the news article."),
});
export type NaverNewsKeywordItem = z.infer<typeof NaverNewsKeywordItemSchema>;

const FetchNaverNewsKeywordsOutputSchema = z.object({
  keywords: z
    .array(NaverNewsKeywordItemSchema)
    .describe("A list of news keywords with their URLs."),
});
export type FetchNaverNewsKeywordsOutput = z.infer<
  typeof FetchNaverNewsKeywordsOutputSchema
>;

// This is the function that will be called from the client-side.
export async function fetchNaverNewsKeywords(): Promise<FetchNaverNewsKeywordsOutput> {
  return fetchNaverNewsKeywordsFlow();
}

const fetchNaverNewsKeywordsFlow = ai.defineFlow(
  {
    name: "fetchNaverNewsKeywordsFlow",
    inputSchema: z.void(), // No input needed for this flow
    outputSchema: FetchNaverNewsKeywordsOutputSchema,
  },
  async () => {
    console.log(`Attempting to fetch keywords from: ${NAVER_NEWS_RANKING_URL}`);
    // !!! IMPORTANT PLACEHOLDER !!!
    // The following is placeholder logic.
    // You will need to implement actual web scraping here using libraries
    // like 'axios' (for HTTP requests) and 'cheerio' (for parsing HTML).
    // Ensure you have installed these libraries (e.g., npm install axios cheerio).
    // Also, handle potential errors, rate limiting, and respect Naver's terms of service.
    //
    // Example (conceptual - actual implementation will vary significantly):
    //
    try {
      const axios = require("axios"); // Uncomment after installing axios
      const cheerio = require("cheerio"); // Uncomment after installing cheerio
      const iconv = require("iconv-lite"); // Add this line after installing iconv-lite

      const { data } = await axios.get(NAVER_NEWS_RANKING_URL, {
        headers: {
          // Using a common User-Agent can help avoid simple blocks
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        responseType: "arraybuffer",
      });

      const html = iconv.decode(data, "euc-kr");
      const $ = cheerio.load(html);

      const keywordsData: NaverNewsKeywordItem[] = [];
      // IMPORTANT: The selector below is an EXAMPLE and WILL LIKELY BE INCORRECT or change.
      // You MUST inspect the current HTML structure of Naver's ranking page to find the correct selectors.
      // Look for elements containing the ranking, title, and link of each news item.
      $("a.list_title").each((index: number, element: Element) => {
        // Removed the limit: if (keywordsData.length < 10)
        const title = $(element).text().trim();
        let url = $(element).attr("href");

        if (title && url) {
          // Ensure URL is absolute
          if (!url.startsWith("http")) {
            const urlObj = new URL(NAVER_NEWS_RANKING_URL);
            url = `${urlObj.protocol}//${urlObj.hostname}${url}`;
          }
          keywordsData.push({
            rank: index + 1, // Or extract rank if available directly
            keyword: title,
            articleUrl: url,
          });
        }
      });

      if (keywordsData.length === 0) {
        console.warn(
          "Scraping Naver News rankings might have failed (no items found) or the page structure changed. Check selectors."
        );
        // Consider returning an empty array or a specific error structure
        return { keywords: [] }; // Or fallback to mock data if preferred
      }
      return { keywords: keywordsData };
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error scraping Naver News ranking page:", error.message);
        // Fallback or error reporting
        throw new Error(
          `Failed to scrape Naver News keywords: ${error.message}`
        );
      } else {
        console.error("Error scraping Naver News ranking page:", error);
        throw new Error("Failed to scrape Naver News keywords: Unknown error");
      }
    }
  }
);
