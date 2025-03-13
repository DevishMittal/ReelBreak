import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Sidebar from "@/components/Sidebar";

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
        <Sidebar />
        <main className="flex-1">
          {children}
          <Toaster />
        </main>
      </body>
    </html>
  );
}