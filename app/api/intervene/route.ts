import { NextResponse } from "next/server";
import { pipe } from "@screenpipe/js";
import { getSettings, updateSettings, ScreenBreakSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getSettings();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    let results;
    try {
      results = await pipe.queryScreenpipe({
        startTime: fiveMinutesAgo,
        contentType: "ocr",
        limit: 100,
        includeFrames: false,
      });
    } catch (queryError) {
      console.error("Screenpipe query failed:", queryError);
      return NextResponse.json({ usageMinutes: 0, usage: [], error: queryError instanceof Error ? queryError.message : "Unknown error" }, { status: 500 });
    }

    const usage = [];
    let lastTimestamp: string | null = null;
    const PLATFORMS = {
      "youtube.com/shorts": "YouTube Shorts",
      "instagram.com/reels": "Instagram Reels",
      "tiktok.com": "TikTok",
    };

    if (results && results.data?.length) {
      const sortedData = results.data.sort((a, b) => 
        new Date(a.content.timestamp).getTime() - new Date(b.content.timestamp).getTime()
      );
      for (const item of sortedData) {
        if (item.type !== "OCR" || !item.content.browserUrl) continue;
        const url = item.content.browserUrl.toLowerCase();
        const platform = Object.keys(PLATFORMS).find((key) => url.includes(key));
        if (platform) {
          const currentTimestamp = item.content.timestamp;
          if (settings.lastReset && new Date(currentTimestamp) < new Date(settings.lastReset)) continue;
          if (lastTimestamp) {
            const duration = (new Date(currentTimestamp).getTime() - new Date(lastTimestamp).getTime()) / 1000;
            if (duration > 0) {
              usage.push({
                platform: PLATFORMS[platform as keyof typeof PLATFORMS],
                timestamp: lastTimestamp,
                duration,
              });
            }
          }
          lastTimestamp = currentTimestamp;
        }
      }
    }

    // Deduplicate by timestamp
    const existingTimestamps = new Set(settings.usageHistory.map(entry => entry.timestamp));
    const newUsage = usage.filter(entry => !existingTimestamps.has(entry.timestamp));
    const updatedHistory = [...settings.usageHistory, ...newUsage];
    const cleanHistory = updatedHistory.filter(entry => entry.duration > 0);

    // Daily reset logic
    const today = new Date().toISOString().split("T")[0];
    const lastResetDate = new Date(settings.lastReset || "1970-01-01").toISOString().split("T")[0];
    if (lastResetDate !== today) {
      console.log(`[Intervene] Resetting usageHistory for ${today}`);
      const todayHistory = cleanHistory.filter(
        (entry) => new Date(entry.timestamp).toISOString().split("T")[0] === today
      );
      cleanHistory.length = 0; // Clear old data
      cleanHistory.push(...todayHistory); // Keep only today's data
      await updateSettings({ usageHistory: cleanHistory, lastReset: new Date().toISOString() });
    } else {
      await updateSettings({ usageHistory: cleanHistory });
    }

    // Calculate today’s usage
    const todayUsage = cleanHistory
      .filter((entry) => new Date(entry.timestamp).toISOString().split("T")[0] === today)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0) / 60;
    console.log(`[Intervene] Total usage today (minutes): ${todayUsage.toFixed(2)} for ${today}`);

    if (todayUsage > settings.interventionThreshold) {
      try {
        await pipe.sendDesktopNotification({
          title: "ScreenBreak Alert",
          body: `You've spent ${Math.round(todayUsage)} minutes on short-form videos today—time for a break?`,
        });
        await updateSettings({ lastNotified: new Date().toISOString() });
      } catch (notifyError) {
        console.error("Notification failed:", notifyError);
      }
    }

    return NextResponse.json({ usageMinutes: todayUsage, usage: cleanHistory });
  } catch (error) {
    console.error("Intervene route error:", error);
    return NextResponse.json({ 
      usageMinutes: 0, 
      usage: [], 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}