import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenContribute - Discover Under-the-Radar Startups",
  description: "Find meaningful contribution opportunities in high-quality open-source startups. AI, DevTools, DevOps, Fullstack, Web3.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
