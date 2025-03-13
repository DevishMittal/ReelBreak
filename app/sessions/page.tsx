"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiRefreshCw } from "react-icons/fi";

interface UsageEntry {
  platform: string;
  timestamp: string;
  duration: number;
}

interface Session {
  startTime: string;
  endTime: string;
  totalDuration: number; // in minutes
  platformBreakdown: { [key: string]: number }; // Platform: minutes
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchSessions(date: Date) {
    try {
      setLoading(true);
      const settingsRes = await fetch("/api/settings");
      if (!settingsRes.ok) throw new Error("Failed to fetch settings");
      const updatedSettings = await settingsRes.json();

      // Get entries for the selected date
      const dateStr = date.toISOString().split("T")[0];
      const filteredEntries = (updatedSettings.usageHistory || [])
        .filter((entry: UsageEntry) => new Date(entry.timestamp).toISOString().split("T")[0] === dateStr)
        .sort((a: UsageEntry, b: UsageEntry) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

      // Group entries into sessions (gaps > 5 minutes)
      const sessionList: Session[] = [];
      let currentSessionEntries: UsageEntry[] = [];
      filteredEntries.forEach((entry: UsageEntry, index: number) => {
        if (index === 0) {
          currentSessionEntries.push(entry);
        } else {
          const prevTimestamp = new Date(filteredEntries[index - 1].timestamp).getTime();
          const currTimestamp = new Date(entry.timestamp).getTime();
          if ((currTimestamp - prevTimestamp) / 1000 / 60 > 5) {
            const startTime = new Date(currentSessionEntries[0].timestamp).toLocaleTimeString();
            const endTime = new Date(currentSessionEntries[currentSessionEntries.length - 1].timestamp).toLocaleTimeString();
            const totalDuration = currentSessionEntries.reduce((sum, e) => sum + e.duration, 0) / 60;
            const platformBreakdown = currentSessionEntries.reduce((acc: { [key: string]: number }, entry) => {
              acc[entry.platform] = (acc[entry.platform] || 0) + entry.duration / 60;
              return acc;
            }, {});
            sessionList.push({ startTime, endTime, totalDuration, platformBreakdown });
            currentSessionEntries = [entry];
          } else {
            currentSessionEntries.push(entry);
          }
        }
      });

      // Add the last session if it exists
      if (currentSessionEntries.length) {
        const startTime = new Date(currentSessionEntries[0].timestamp).toLocaleTimeString();
        const endTime = new Date(currentSessionEntries[currentSessionEntries.length - 1].timestamp).toLocaleTimeString();
        const totalDuration = currentSessionEntries.reduce((sum, e) => sum + e.duration, 0) / 60;
        const platformBreakdown = currentSessionEntries.reduce((acc: { [key: string]: number }, entry) => {
          acc[entry.platform] = (acc[entry.platform] || 0) + entry.duration / 60;
          return acc;
        }, {});
        sessionList.push({ startTime, endTime, totalDuration, platformBreakdown });
      }

      setSessions(sessionList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions(selectedDate);
    const interval = setInterval(() => fetchSessions(selectedDate), 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [selectedDate]);

  const handleRefresh = () => {
    fetchSessions(selectedDate);
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Sessions</h1>
          <Button
            onClick={handleRefresh}
            className="bg-blue-600 text-white hover:bg-blue-700 flex items-center space-x-2 px-4 py-2 rounded-lg shadow-md"
          >
            <FiRefreshCw className="animate-spin-slow" />
            <span>Refresh</span>
          </Button>
        </div>
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Select Date</label>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date) => setSelectedDate(date)}
            dateFormat="yyyy-MM-dd"
            className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-colors duration-200"
          />
        </div>
        <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
            <CardTitle className="text-xl font-semibold">
              Sessions for {selectedDate.toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {sessions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                      <th className="p-4 rounded-tl-lg border-b border-purple-500" title="Start time of the session">
                        Start Time
                      </th>
                      <th className="p-4 border-b border-purple-500" title="End time of the session">
                        End Time
                      </th>
                      <th className="p-4 border-b border-purple-500" title="Total duration in minutes">
                        Duration (minutes)
                      </th>
                      <th className="p-4 rounded-tr-lg border-b border-purple-500" title="Time spent on each platform">
                        Platforms Breakdown
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session, index) => (
                      <tr
                        key={index}
                        className={`${
                          index % 2 === 0 ? "bg-gray-50 dark:bg-gray-700" : "bg-white dark:bg-gray-800"
                        } hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors duration-200 animate-fade-in`}
                      >
                        <td className="p-4 border-b border-gray-200 dark:border-gray-600">
                          {session.startTime}
                        </td>
                        <td className="p-4 border-b border-gray-200 dark:border-gray-600">
                          {session.endTime}
                        </td>
                        <td className="p-4 border-b border-gray-200 dark:border-gray-600">
                          {session.totalDuration.toFixed(2)}
                        </td>
                        <td className="p-4 border-b border-gray-200 dark:border-gray-600">
                          {Object.entries(session.platformBreakdown).map(([platform, minutes], idx) => (
                            <div key={idx} className="text-gray-700 dark:text-gray-300">
                              {platform}: {minutes.toFixed(2)} min
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No sessions recorded on {selectedDate.toLocaleDateString()}.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}