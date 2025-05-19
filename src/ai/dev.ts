
import { config } from 'dotenv';
config();

import '@/ai/flows/elaborate-blog-content.ts';
import '@/ai/flows/generate-blog-draft.ts';
import '@/ai/flows/fetch-naver-news-keywords.ts';
import '@/ai/flows/fetch-pixabay-images.ts'; // Add this line
import '@/ai/flows/generate-blog-from-custom-keywords.ts'; // Add this line

