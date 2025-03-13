"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const [settings, setSettings] = useState<{
    dailyGoal: number;
    interventionThreshold: number;
  }>({
    dailyGoal: 30,
    interventionThreshold: 15,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchSettings() {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          dailyGoal: data.dailyGoal ?? 30,
          interventionThreshold: data.interventionThreshold ?? 15,
        });
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/settings", {
      method: "POST",
      body: JSON.stringify(settings),
      headers: { "Content-Type": "application/json" },
    });
    router.push("/");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <Card>
          <CardHeader>
            <CardTitle>Usage Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Daily Goal (minutes)
                </label>
                <Input
                  type="number"
                  value={settings.dailyGoal}
                  onChange={(e) => setSettings({ ...settings, dailyGoal: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Intervention Threshold (minutes)
                </label>
                <Input
                  type="number"
                  value={settings.interventionThreshold}
                  onChange={(e) => setSettings({ ...settings, interventionThreshold: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <Button type="submit">Save</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}