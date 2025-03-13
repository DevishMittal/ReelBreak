"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FiSettings } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface UsageEntry {
  platform: string;
  timestamp: string;
  duration: number;
}

interface WeeklyTrend {
  date: string;
  dailyUsage: number;
  dailyGoal: number;
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
  const [currentSession, setCurrentSession] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  async function fetchData() {
    try {
      const res = await fetch("/api/intervene");
      if (!res.ok) throw new Error("Failed to fetch intervention data");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUsage(data.usage || []);
      const newUsageMinutes = Math.max(data.usageMinutes || 0, 0);
      setTodayUsage(newUsageMinutes);
      setShowOverlay(newUsageMinutes > settings.interventionThreshold);

      const settingsRes = await fetch("/api/settings");
      if (!settingsRes.ok) throw new Error("Failed to fetch settings");
      const updatedSettings = await settingsRes.json();
      setSettings({
        dailyGoal: updatedSettings.dailyGoal ?? 30,
        interventionThreshold: updatedSettings.interventionThreshold ?? 15,
        usageHistory: updatedSettings.usageHistory ?? [],
      });

      // Calculate current session and session count
      const today = new Date().toISOString().split("T")[0];
      const todayEntries = updatedSettings.usageHistory?.filter((entry: UsageEntry) =>
        new Date(entry.timestamp).toISOString().split("T")[0] === today
      ) || [];

      // Session logic: Group entries by gaps > 5 minutes
      const sessions: UsageEntry[][] = [];
      let currentSessionEntries: UsageEntry[] = [];
      todayEntries.forEach((entry: UsageEntry, index: number) => {
        if (index === 0) {
          currentSessionEntries.push(entry);
        } else {
          const prevTimestamp = new Date(todayEntries[index - 1].timestamp).getTime();
          const currTimestamp = new Date(entry.timestamp).getTime();
          if ((currTimestamp - prevTimestamp) / 1000 / 60 > 5) {
            sessions.push(currentSessionEntries);
            currentSessionEntries = [entry];
          } else {
            currentSessionEntries.push(entry);
          }
        }
      });
      if (currentSessionEntries.length) sessions.push(currentSessionEntries);
      setSessionCount(sessions.length);

      // Current session: Sum durations of the last session
      const lastSession = sessions[sessions.length - 1] || [];
      const sessionDuration = lastSession.reduce((sum, entry) => sum + entry.duration, 0) / 60;
      setCurrentSession(sessionDuration);

      // Weekly trend: Calculate daily usage for the past 7 days
      const weeklyData: WeeklyTrend[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dailyUsage = (updatedSettings.usageHistory?.filter((entry: UsageEntry) =>
          new Date(entry.timestamp).toISOString().split("T")[0] === dateStr
        ) || []).reduce((sum: number, entry: UsageEntry) => sum + entry.duration, 0) / 60;
        weeklyData.push({
          date: date.toLocaleDateString("en-US", { weekday: "short" }),
          dailyUsage: Math.round(dailyUsage),
          dailyGoal: updatedSettings.dailyGoal,
        });
      }
      setWeeklyTrend(weeklyData);
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

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">ScreenBreak Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Today’s Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{Math.round(todayUsage)} minutes</p>
              <p className="text-sm text-green-600">
                {Math.max(settings.dailyGoal - todayUsage, 0)} minutes remaining
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Current Session</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{Math.round(currentSession)} minutes</p>
              <p className="text-sm text-green-600">
                {Math.max(settings.interventionThreshold - currentSession, 0)} minutes remaining
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Session Count</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{sessionCount} today</p>
              <p className="text-sm text-green-600">{sessionCount <= 3 ? "Healthy usage pattern" : "Consider taking breaks"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Daily Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{settings.dailyGoal} minutes</p>
              <a href="/settings" className="text-sm text-blue-600 hover:underline flex items-center">
                Set in settings <FiSettings className="ml-1" />
              </a>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Platform Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {usage.length > 0 ? (
                <ul className="space-y-2">
                  {Object.entries(
                    usage.reduce((acc: { [key: string]: number }, entry: UsageEntry) => {
                      acc[entry.platform] = (acc[entry.platform] || 0) + entry.duration;
                      return acc;
                    }, {})
                  ).map(([platform, total]) => (
                    <li key={platform} className="flex justify-between">
                      <span>{platform}</span>
                      <span>{(total / 60).toFixed(1)} minutes</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No platforms available yet</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Daily Goal Progress</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="relative w-32 h-32">
                <Progress
                  value={(todayUsage / settings.dailyGoal) * 100}
                  className="w-32 h-32 rounded-full"
                  style={{ transform: "rotate(-90deg)" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xl font-semibold">{Math.round(todayUsage)}/{settings.dailyGoal}</p>
                </div>
              </div>
              <div className="ml-4">
                <p className="flex items-center"><span className="w-4 h-4 bg-blue-500 inline-block mr-2"></span> Used</p>
                <p className="flex items-center"><span className="w-4 h-4 bg-gray-300 inline-block mr-2"></span> Remaining</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Weekly Usage Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="dailyUsage" stroke="#2DD4BF" name="Daily Usage (minutes)" />
                <Line type="monotone" dataKey="dailyGoal" stroke="#F87171" strokeDasharray="5 5" name="Daily Goal" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {showOverlay && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
        >
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-bold mb-4">Usage Limit Exceeded</h2>
            <p className="mb-4">
              You’ve spent {Math.round(todayUsage)} minutes today, exceeding your {settings.interventionThreshold}-minute threshold!
            </p>
            <button
              onClick={() => setShowOverlay(false)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}