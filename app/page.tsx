"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { FiSettings, FiRefreshCw } from "react-icons/fi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

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
  const [platformBreakdown, setPlatformBreakdown] = useState<{ name: string; minutes: number }[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  async function fetchData() {
    try {
      setLoading(true);
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
      console.log("Fetched settings:", updatedSettings); // Debug log
      setSettings({
        dailyGoal: updatedSettings.dailyGoal ?? 30,
        interventionThreshold: updatedSettings.interventionThreshold ?? 15,
        usageHistory: updatedSettings.usageHistory ?? [],
      });

      // Calculate platform breakdown, current session, and session count from usageHistory
      const today = new Date().toISOString().split("T")[0];
      const todayEntries = (updatedSettings.usageHistory || [])
        .filter((entry: UsageEntry) => new Date(entry.timestamp).toISOString().split("T")[0] === today)
        .sort((a: UsageEntry, b: UsageEntry) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

      // Platform Breakdown
      const breakdown = Object.entries(
        todayEntries.reduce((acc: { [key: string]: number }, entry: UsageEntry) => {
          acc[entry.platform] = (acc[entry.platform] || 0) + entry.duration;
          return acc;
        }, {})
      ).map(([name, total]) => ({ name,minutes: parseFloat((total / 60).toFixed(1)) }));
      setPlatformBreakdown(breakdown);

      // Session logic
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

      // Current session
      const lastSession = sessions[sessions.length - 1] || [];
      const sessionDuration = lastSession.reduce((sum: number, entry: UsageEntry) => sum + entry.duration, 0) / 60;
      setCurrentSession(sessionDuration);

      // Weekly trend
      const weeklyData: WeeklyTrend[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dailyUsage = ((updatedSettings.usageHistory || [])
          .filter((entry: UsageEntry) => new Date(entry.timestamp).toISOString().split("T")[0] === dateStr)
          .reduce((sum: number, entry: UsageEntry) => sum + entry.duration, 0) / 60) || 0;
        weeklyData.push({
          date: date.toLocaleDateString("en-US", { weekday: "short" }),
          dailyUsage: Math.round(dailyUsage),
          dailyGoal: updatedSettings.dailyGoal || 30,
        });
      }
      setWeeklyTrend(weeklyData);
      console.log("Weekly trend data:", weeklyData); // Debug log
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

  const handleRefresh = () => {
    fetchData();
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">ReelBreak Dashboard</h1>
          <Button
            onClick={handleRefresh}
            className="bg-blue-600 text-white hover:bg-blue-700 flex items-center space-x-2 px-4 py-2 rounded-lg shadow-md"
          >
            <FiRefreshCw className="animate-spin-slow" />
            <span>Refresh</span>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg">
              <CardTitle className="text-lg font-semibold">Today’s Usage</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{Math.round(todayUsage)} minutes</p>
              <p className="text-lg text-green-600 dark:text-green-400 mt-2">
                {Math.max(settings.dailyGoal - todayUsage, 0).toFixed(1)} minutes remaining
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg">
              <CardTitle className="text-lg font-semibold">Current Session</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{Math.round(currentSession)} minutes</p>
              <p className="text-lg text-green-600 dark:text-green-400 mt-2">
                {Math.max(settings.interventionThreshold - currentSession, 0).toFixed(1)} minutes remaining
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg">
              <CardTitle className="text-lg font-semibold">Session Count</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{sessionCount} today</p>
              <p className="text-lg text-green-600 dark:text-green-400 mt-2">
                {sessionCount <= 3 ? "Healthy usage pattern" : "Consider taking breaks"}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg">
              <CardTitle className="text-lg font-semibold">Daily Goal</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{settings.dailyGoal} minutes</p>
              <a
                href="/settings"
                className="text-lg text-blue-600 dark:text-blue-400 hover:underline flex items-center mt-2"
              >
                Set in settings <FiSettings className="ml-2" />
              </a>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg">
              <CardTitle className="text-xl font-semibold">Platform Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  layout="vertical"
                  data={platformBreakdown}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    domain={[0, Number(Math.max(...platformBreakdown.map((d) => d.minutes)).toFixed(1)) * 1.2]}
                    stroke="#4B5563"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis dataKey="name" type="category" width={150} stroke="#4B5563" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(31, 41, 55, 0.9)", color: "#fff" }}
                    formatter={(value: number) => `${value.toFixed(1)} minutes`}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="minutes" fill="#F87171">
                    {platformBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg">
              <CardTitle className="text-xl font-semibold">Daily Goal Progress</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex justify-center items-center">
              <div className="relative w-40 h-40">
                <Progress
                  value={(todayUsage / settings.dailyGoal) * 100}
                  className="w-40 h-40 rounded-full"
                  style={{ transform: "rotate(-90deg)" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-sky-400">
                    {Math.round(todayUsage)}/{settings.dailyGoal}
                  </p>
                </div>
              </div>
              <div className="ml-6">
                <p className="flex items-center text-lg"><span className="w-4 h-4 bg-blue-600 dark:bg-sky-400 inline-block mr-2 rounded-full"></span> Used</p>
                <p className="flex items-center text-lg"><span className="w-4 h-4 bg-gray-300 dark:bg-gray-600 inline-block mr-2 rounded-full"></span> Remaining</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 mt-6">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg">
            <CardTitle className="text-xl font-semibold">Weekly Usage Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#4B5563" tick={{ fontSize: 12 }} />
                <YAxis stroke="#4B5563" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "rgba(31, 41, 55, 0.9)", color: "#fff" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="dailyUsage"
                  stroke="#2DD4BF"
                  strokeWidth={2}
                  name="Daily Usage (minutes)"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="dailyGoal"
                  stroke="#F87171"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Daily Goal"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {showOverlay && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fade-in"
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl transform transition-all duration-300 hover:scale-105">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Usage Limit Exceeded</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
              You’ve spent {Math.round(todayUsage)} minutes today, exceeding your {settings.interventionThreshold}-minute threshold!
            </p>
            <button
              onClick={() => setShowOverlay(false)}
              className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors duration-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}