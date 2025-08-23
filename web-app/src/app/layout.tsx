import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeTree Web - Git Worktree Manager with AI",
  description: "Manage parallel git worktrees and work with Claude AI in the browser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
