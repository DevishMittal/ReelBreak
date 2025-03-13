"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FiArrowLeft, FiTrash2, FiRefreshCw } from "react-icons/fi";
import Link from "next/link";
import { toast } from "@/components/ui/use-toast";

export default function Settings() {
  const [settings, setSettings] = useState<{
    dailyGoal: number;
    interventionThreshold: number;
    enableNotifications: boolean;
  }>({
    dailyGoal: 30,
    interventionThreshold: 15,
    enableNotifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();
        console.log("Fetched settings in settings page:", data);
        setSettings({
          dailyGoal: data.dailyGoal ?? 30,
          interventionThreshold: data.interventionThreshold ?? 15,
          enableNotifications: data.enableNotifications ?? true,
        });
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          title: "Error",
          description: "Failed to fetch settings.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        body: JSON.stringify(settings),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to save settings");
      toast({
        title: "Success",
        description: "Settings saved successfully!",
        variant: "default",
      });
      router.push("/");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetUsageHistory = async () => {
    setResetting(true);
    try {
      const res = await fetch("/api/settings/reset", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to reset usage history");
      toast({
        title: "Success",
        description: "Usage history has been reset.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error resetting usage history:", error);
      toast({
        title: "Error",
        description: "Failed to reset usage history.",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center text-lg"
          >
            <FiArrowLeft className="mr-2" /> Back to Dashboard
          </Link>
        </div>
        <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 max-w-2xl mx-auto">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg">
            <CardTitle className="text-xl font-semibold">Usage Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Daily Goal (minutes)
                  <span className="text-gray-500 dark:text-gray-400 text-xs block">
                    The maximum screen time you aim for each day.
                  </span>
                </label>
                <Input
                  type="number"
                  value={settings.dailyGoal}
                  onChange={(e) => setSettings({ ...settings, dailyGoal: Number(e.target.value) })}
                  className="mt-1 p-3 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Intervention Threshold (minutes)
                  <span className="text-gray-500 dark:text-gray-400 text-xs block">
                    Triggers a reminder when your current session exceeds this limit.
                  </span>
                </label>
                <Input
                  type="number"
                  value={settings.interventionThreshold}
                  onChange={(e) => setSettings({ ...settings, interventionThreshold: Number(e.target.value) })}
                  className="mt-1 p-3 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  min={0}
                />
              </div>
              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800 px-6 py-2 rounded-lg flex items-center space-x-2"
                >
                  {saving && <FiRefreshCw className="animate-spin-slow" />}
                  <span>{saving ? "Saving..." : "Save"}</span>
                </Button>
   
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}