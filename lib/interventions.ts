import { pipe } from "@screenpipe/js";

// Define the UsageEntry interface or import it
interface UsageEntry {
  platform: string;
  timestamp: string;
  duration: number;
}

export async function checkAndNotify(usageHistory: UsageEntry[], threshold: number) {
  const today = new Date().toISOString().split("T")[0];
  const todayUsage = usageHistory
    .filter((entry) => entry.timestamp.startsWith(today))
    .reduce((sum, entry) => sum + entry.duration, 0) / 60; // minutes

  if (todayUsage > threshold) {
    await pipe.sendDesktopNotification({
      title: "ScreenBreak Alert",
      body: `You've spent ${Math.round(todayUsage)} minutes on short-form videos today—time for a break?`,
    });
  }

  return todayUsage;
}