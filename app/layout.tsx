import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import { FiHome, FiSettings } from "react-icons/fi";

export const metadata: Metadata = {
  title: "Example Pipe • Screenpipe",
  description: "A clean starting point for your Screenpipe pipe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased min-h-screen bg-background flex"
        suppressHydrationWarning
        data-suppress-hydration-warning={true}
      >
        <aside className="w-64 bg-purple-800 text-white min-h-screen p-4">
          <h1 className="text-2xl font-bold mb-8">ReelBreak</h1>
          <nav>
            <ul className="space-y-4">
              <li>
                <Link href="/" className="flex items-center space-x-2 hover:text-purple-300">
                  <FiHome />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link href="/settings" className="flex items-center space-x-2 hover:text-purple-300">
                  <FiSettings />
                  <span>Settings</span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
        <main className="flex-1">
          {children}
          <Toaster />
        </main>
      </body>
    </html>
  );
}