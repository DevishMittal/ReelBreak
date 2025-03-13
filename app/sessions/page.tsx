"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
            // End of a session
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

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Sessions</h1>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date) => setSelectedDate(date)}
            dateFormat="yyyy-MM-dd"
            className="p-2 border rounded"
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Sessions for {selectedDate.toLocaleDateString()}</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-400">
                    <th className="p-2 border-b">Start Time</th>
                    <th className="p-2 border-b">End Time</th>
                    <th className="p-2 border-b">Duration (minutes)</th>
                    <th className="p-2 border-b">Platforms Breakdown</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session, index) => (
                    <tr key={index} className="hover:bg-gray-100 transition-colors">
                      <td className="p-2 border-b">{session.startTime}</td>
                      <td className="p-2 border-b">{session.endTime}</td>
                      <td className="p-2 border-b">{session.totalDuration.toFixed(2)}</td>
                      <td className="p-2 border-b">
                        {Object.entries(session.platformBreakdown).map(([platform, minutes], idx) => (
                          <div key={idx}>
                            {platform}: {minutes.toFixed(2)} min
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No sessions recorded on {selectedDate.toLocaleDateString()}.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}