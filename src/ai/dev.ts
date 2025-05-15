
import { config } from 'dotenv';
config();

import '@/ai/flows/elaborate-blog-content.ts';
import '@/ai/flows/generate-blog-draft.ts';
import '@/ai/flows/fetch-naver-news-keywords.ts'; // Add this line
