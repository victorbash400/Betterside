import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "BetterSide",
  description: "Explore issues, find responses, and contribute.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
