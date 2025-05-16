"use server";
/**
 * @fileOverview Fetches images from Pixabay API based on a search query.
 *
 * - fetchPixabayImages - Fetches images from Pixabay.
 * - FetchPixabayImagesInput - Input type for fetching images.
 * - FetchPixabayImagesOutput - Output type for fetched images.
 * - PixabayImage - Type for a single Pixabay image item.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import axios from "axios"; // Ensure axios is installed: npm install axios

const PIXABAY_API_URL = "https://pixabay.com/api/";

const FetchPixabayImagesInputSchema = z.object({
  query: z.string().describe("The search term for images."),
  count: z
    .number()
    .optional()
    .default(5)
    .describe("Number of images to fetch, defaults to 5."),
});
export type FetchPixabayImagesInput = z.infer<
  typeof FetchPixabayImagesInputSchema
>;

const PixabayImageSchema = z.object({
  id: z.number(),
  pageURL: z.string().url(),
  type: z.string(),
  tags: z.string(),
  previewURL: z.string().url(),
  previewWidth: z.number(),
  previewHeight: z.number(),
  webformatURL: z.string().url(),
  webformatWidth: z.number(),
  webformatHeight: z.number(),
  largeImageURL: z.string().url(),
  imageWidth: z.number(),
  imageHeight: z.number(),
  imageSize: z.number(),
  views: z.number(),
  downloads: z.number(),
  collections: z.number(),
  likes: z.number(),
  comments: z.number(),
  user_id: z.number(),
  user: z.string(),
  userImageURL: z.string().url(),
});
export type PixabayImage = z.infer<typeof PixabayImageSchema>;

const FetchPixabayImagesOutputSchema = z.object({
  images: z
    .array(PixabayImageSchema)
    .describe("A list of images from Pixabay."),
});
export type FetchPixabayImagesOutput = z.infer<
  typeof FetchPixabayImagesOutputSchema
>;

export async function fetchPixabayImages(
  input: FetchPixabayImagesInput
): Promise<FetchPixabayImagesOutput> {
  return fetchPixabayImagesFlow(input);
}

const fetchPixabayImagesFlow = ai.defineFlow(
  {
    name: "fetchPixabayImagesFlow",
    inputSchema: FetchPixabayImagesInputSchema,
    outputSchema: FetchPixabayImagesOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) {
      console.error(
        "Pixabay API key is not set in .env file (PIXABAY_API_KEY)"
      );
      // Return empty array or a specific error structure if API key is missing
      // For now, returning empty to avoid breaking the UI completely, but a proper error state should be handled.
      // throw new Error('Pixabay API key is missing. Please set PIXABAY_API_KEY in your .env file.');
      return { images: [] }; // Or handle this more gracefully in the UI
    }

    const { query, count } = input;
    const params = {
      key: apiKey,
      q: query,
      image_type: "photo",
      per_page: count,
      safesearch: "true",
      lang: "ko", // Fetch Korean images if available
    };

    try {
      console.log(
        `Fetching images from Pixabay for query: ${query}, count: ${count}, params: ${JSON.stringify(
          params
        )}`
      );
      const response = await axios.get(PIXABAY_API_URL, { params });

      if (response.data && response.data.hits) {
        // Ensure the data matches the schema, or transform/validate as needed.
        // For simplicity, we assume Pixabay's 'hits' directly match our PixabayImageSchema structure.
        // In a production app, you might want to validate this more robustly.
        const validatedImages = response.data.hits
          .map((hit: any) => {
            // Basic check for essential fields, more robust validation could be added
            if (hit.id && hit.webformatURL && hit.tags && hit.user) {
              return {
                id: hit.id,
                pageURL: hit.pageURL,
                type: hit.type,
                tags: hit.tags,
                previewURL: hit.previewURL,
                previewWidth: hit.previewWidth,
                previewHeight: hit.previewHeight,
                webformatURL: hit.webformatURL,
                webformatWidth: hit.webformatWidth,
                webformatHeight: hit.webformatHeight,
                largeImageURL: hit.largeImageURL,
                imageWidth: hit.imageWidth,
                imageHeight: hit.imageHeight,
                imageSize: hit.imageSize,
                views: hit.views,
                downloads: hit.downloads,
                collections: hit.collections,
                likes: hit.likes,
                comments: hit.comments,
                user_id: hit.user_id,
                user: hit.user,
                userImageURL:
                  hit.userImageURL || `https://placehold.co/32x32.png`, // Fallback for missing userImageURL
              };
            }
            return null;
          })
          .filter(
            (img: PixabayImage | null): img is PixabayImage => img !== null
          );

        return { images: validatedImages as PixabayImage[] };
      } else {
        console.warn(
          "No hits found in Pixabay response or unexpected data structure."
        );
        return { images: [] };
      }
    } catch (error: any) {
      console.error("Error fetching images from Pixabay:", error.message);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Pixabay API Error Details:", error.response.data);
      }
      // In case of error, return empty array or throw. For now, returning empty.
      // throw new Error(`Failed to fetch images from Pixabay: ${error.message}`);
      return { images: [] };
    }
  }
);
