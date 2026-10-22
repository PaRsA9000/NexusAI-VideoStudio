import type { Metadata } from "next";
export const metadata: Metadata = { title: "NexusAI Video Studio", description: "AI video generation workspace" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
