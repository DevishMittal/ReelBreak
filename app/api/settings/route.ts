import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSettings();
    console.log("Settings fetched:", settings); // Debug log
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to get settings:", error);
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dailyGoal, interventionThreshold } = body;
    const updatedSettings = await updateSettings({ dailyGoal, interventionThreshold });
    console.log("Settings updated:", updatedSettings); // Debug log
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}