import { useState, useEffect } from "react";
import { pipe } from "@screenpipe/js";
import type { Settings as ScreenpipeSettings } from "@screenpipe/js";

interface ScreenBreakSettings {
  exampleSetting: string;
  usageHistory: { platform: string; timestamp: string; duration: number }[];
  dailyGoal: number; // minutes
  interventionThreshold: number; // minutes
}

const DEFAULT_SETTINGS: ScreenBreakSettings = {
  exampleSetting: "", // Add this line to match the interface
  usageHistory: [],
  dailyGoal: 30,
  interventionThreshold: 15,
};

export function usePipeSettings() {
  const [settings, setSettings] = useState<ScreenBreakSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const screenpipeSettings = await pipe.settings.getAll();
    const pipeSettings = screenpipeSettings.customSettings?.screenbreak || DEFAULT_SETTINGS;
    setSettings(pipeSettings);
    setLoading(false);
  }

  async function updateSettings(newSettings: Partial<ScreenBreakSettings>) {
    const updated = { ...settings, ...newSettings };
    await pipe.settings.update({
      customSettings: { screenbreak: updated },
    });
    setSettings(updated);
  }

  return { settings, updateSettings, loading };
}