import { pipe } from "@screenpipe/js";

interface UsageEntry {
  platform: string;
  timestamp: string;
  duration: number; // in seconds
}

const PLATFORMS = {
  "youtube.com/shorts": "YouTube Shorts",
  "instagram.com/reels": "Instagram Reels",
  "tiktok.com": "TikTok",
} as const; // Add as const to make the object's properties readonly

// Create a type for the keys of PLATFORMS
type PlatformKey = keyof typeof PLATFORMS;

export async function trackShortFormVideos(): Promise<UsageEntry[]> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const results = await pipe.queryScreenpipe({
    startTime: fiveMinutesAgo,
    contentType: "ocr",
    limit: 100,
    includeFrames: false,
  });

  if (!results || !results.data.length) return [];

  const usage: UsageEntry[] = [];
  let lastTimestamp: string | null = null;

  for (const item of results.data) {
    if (item.type !== "OCR" || !item.content.browserUrl) continue;

    const url = item.content.browserUrl.toLowerCase();
    // Type assertion to tell TypeScript that platform is a valid key or undefined
    const platform = Object.keys(PLATFORMS).find((key) => url.includes(key)) as PlatformKey | undefined;

    if (platform) {
      const currentTimestamp = item.content.timestamp;
      if (lastTimestamp) {
        const duration = (new Date(currentTimestamp).getTime() - new Date(lastTimestamp).getTime()) / 1000;
        usage.push({
          platform: PLATFORMS[platform], // Now TypeScript knows platform is a valid key
          timestamp: lastTimestamp,
          duration,
        });
      }
      lastTimestamp = currentTimestamp;
    }
  }

  return usage;
}