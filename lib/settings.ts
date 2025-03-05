import { pipe } from "@screenpipe/js";

export interface ScreenBreakSettings {
  usageHistory: { platform: string; timestamp: string; duration: number }[];
  dailyGoal: number;
  interventionThreshold: number;
}

const DEFAULT_SETTINGS: ScreenBreakSettings = {
  usageHistory: [],
  dailyGoal: 30,
  interventionThreshold: 15,
};

export async function getSettings(): Promise<ScreenBreakSettings> {
  const screenpipeSettings = await pipe.settings.getAll();
  const customSettings = screenpipeSettings.customSettings?.screenbreak || DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...customSettings,
    usageHistory: customSettings.usageHistory ?? [],
  };
}

export async function updateSettings(newSettings: Partial<ScreenBreakSettings>) {
  const current = await getSettings();
  const updated = {
    ...current,
    ...newSettings,
    usageHistory: newSettings.usageHistory ?? current.usageHistory,
  };
  await pipe.settings.update({
    customSettings: { screenbreak: updated },
  });
  return updated;
}