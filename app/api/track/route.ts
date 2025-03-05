import { NextResponse } from "next/server";
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
};

export async function GET() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  try {
    const results = await pipe.queryScreenpipe({
      startTime: fiveMinutesAgo,
      contentType: "ocr",
      limit: 100,
      includeFrames: false,
    });

    if (!results || !results.data.length) {
      return NextResponse.json({ usage: [] });
    }

    const usage: UsageEntry[] = [];
    let lastTimestamp: string | null = null;

    // Sort results by timestamp to ensure chronological order
    const sortedData = results.data.sort((a, b) =>
      new Date(a.content.timestamp).getTime() - new Date(b.content.timestamp).getTime()
    );

    for (const item of sortedData) {
      if (item.type !== "OCR" || !item.content.browserUrl) continue;

      const url = item.content.browserUrl.toLowerCase();
      const platform = Object.keys(PLATFORMS).find((key) => url.includes(key));

      if (platform) {
        const currentTimestamp = item.content.timestamp;
        if (lastTimestamp) {
          const duration = (new Date(currentTimestamp).getTime() - new Date(lastTimestamp).getTime()) / 1000;
          if (duration > 0) { // Only add positive durations
            usage.push({
              platform: PLATFORMS[platform],
              timestamp: lastTimestamp,
              duration,
            });
          }
        }
        lastTimestamp = currentTimestamp;
      }
    }

    return NextResponse.json({ usage });
  } catch (error) {
    console.error("Error querying Screenpipe:", error);
    return NextResponse.json({ usage: [], error: error.message }, { status: 500 });
  }
}