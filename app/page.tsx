"use client";

import { useEffect, useState } from "react";

interface UsageEntry {
  platform: string;
  timestamp: string;
  duration: number;
}

export default function Dashboard() {
  const [usage, setUsage] = useState<UsageEntry[]>([]);
  const [settings, setSettings] = useState<{
    dailyGoal: number;
    interventionThreshold: number;
    usageHistory: UsageEntry[];
  }>({
    dailyGoal: 30,
    interventionThreshold: 15,
    usageHistory: [],
  });
  const [todayUsage, setTodayUsage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    try {
      const res = await fetch("/api/intervene");
      if (!res.ok) throw new Error("Failed to fetch intervention data");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUsage(data.usage || []);
      setTodayUsage(Math.max(data.usageMinutes || 0, 0)); // Prevent negative usage

      const settingsRes = await fetch("/api/settings");
      if (!settingsRes.ok) throw new Error("Failed to fetch settings");
      const updatedSettings = await settingsRes.json();
      setSettings({
        dailyGoal: updatedSettings.dailyGoal ?? 30,
        interventionThreshold: updatedSettings.interventionThreshold ?? 15,
        usageHistory: updatedSettings.usageHistory ?? [],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>ScreenBreak Dashboard</h1>
      <p>Daily Goal: {settings.dailyGoal} minutes</p>
      <p>Today’s Usage: {Math.round(todayUsage)} minutes</p>
      <p>Status: {todayUsage > settings.dailyGoal ? "Over Goal" : "On Track"}</p>
      <h2>Recent Activity</h2>
      <ul>
        {usage.length > 0 ? (
          usage.map((entry, i) => (
            <li key={i}>
              {entry.platform} - {new Date(entry.timestamp).toLocaleTimeString()} ({entry.duration.toFixed(2)}s)
            </li>
          ))
        ) : (
          <li>No recent activity detected</li>
        )}
      </ul>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const newSettings = {
            dailyGoal: Number(formData.get("goal")),
            interventionThreshold: Number(formData.get("threshold")),
          };
          await fetch("/api/settings", {
            method: "POST",
            body: JSON.stringify(newSettings),
            headers: { "Content-Type": "application/json" },
          });
          setSettings({ ...settings, ...newSettings });
        }}
      >
        <label>
          Daily Goal (minutes):
          <input type="number" name="goal" defaultValue={settings.dailyGoal} />
        </label>
        <label>
          Intervention Threshold (minutes):
          <input type="number" name="threshold" defaultValue={settings.interventionThreshold} />
        </label>
        <button type="submit">Save</button>
      </form>
    </div>
  );
}