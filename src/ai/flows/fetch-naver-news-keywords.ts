
"use server";
/**
 * @fileOverview Fetches trending news keywords and their URLs from Naver News for a specific category.
 * IMPORTANT: This file contains placeholder logic for web scraping.
 * The actual scraping implementation (using libraries like axios and cheerio)
 * needs to be added by the user after installing them.
 *
 * - fetchNaverNewsKeywords - Fetches news keywords and URLs for a given category.
 * - FetchNaverNewsKeywordsInput - The input type for the fetchNaverNewsKeywords function.
 * - NaverNewsKeywordItem - The type for a single fetched keyword item.
 * - FetchNaverNewsKeywordsOutput - The return type for the fetchNaverNewsKeywords function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const NAVER_NEWS_BASE_URL =
  "https://news.naver.com/main/ranking/popularDay.naver";

const FetchNaverNewsKeywordsInputSchema = z.object({
  categoryId: z.string().describe("The category ID (sid1) for Naver News, e.g., '100' for Politics."),
});
export type FetchNaverNewsKeywordsInput = z.infer<typeof FetchNaverNewsKeywordsInputSchema>;


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
export async function fetchNaverNewsKeywords(input: FetchNaverNewsKeywordsInput): Promise<FetchNaverNewsKeywordsOutput> {
  return fetchNaverNewsKeywordsFlow(input);
}

const fetchNaverNewsKeywordsFlow = ai.defineFlow(
  {
    name: "fetchNaverNewsKeywordsFlow",
    inputSchema: FetchNaverNewsKeywordsInputSchema,
    outputSchema: FetchNaverNewsKeywordsOutputSchema,
  },
  async (input) => {
    const { categoryId } = input;
    const targetUrl = `${NAVER_NEWS_BASE_URL}?mid=etc&sid1=${categoryId}`;
    
    console.log(`Attempting to fetch keywords from: ${targetUrl} for category ID: ${categoryId}`);

    try {
      const axios = require("axios"); 
      const cheerio = require("cheerio"); 
      const iconv = require("iconv-lite"); 

      const { data } = await axios.get(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        responseType: "arraybuffer",
      });

      const html = iconv.decode(data, "euc-kr");
      const $ = cheerio.load(html);

      const keywordsData: NaverNewsKeywordItem[] = [];
      $("a.list_title").each((index: number, element: Element) => {
        const title = $(element).text().trim();
        let url = $(element).attr("href");

        if (title && url) {
          if (!url.startsWith("http")) {
            const urlObj = new URL(targetUrl); // Use targetUrl for base
            url = `${urlObj.protocol}//${urlObj.hostname}${url}`;
          }
          keywordsData.push({
            rank: index + 1, 
            keyword: title,
            articleUrl: url,
          });
        }
      });

      if (keywordsData.length === 0) {
        console.warn(
          `Scraping Naver News rankings for category ${categoryId} might have failed (no items found) or the page structure changed. Check selectors.`
        );
        return { keywords: [] }; 
      }
      return { keywords: keywordsData };
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error scraping Naver News ranking page for category ${categoryId}:`, error.message);
        throw new Error(
          `Failed to scrape Naver News keywords for category ${categoryId}: ${error.message}`
        );
      } else {
        console.error(`Error scraping Naver News ranking page for category ${categoryId}:`, error);
        throw new Error(`Failed to scrape Naver News keywords for category ${categoryId}: Unknown error`);
      }
    }
  }
);
