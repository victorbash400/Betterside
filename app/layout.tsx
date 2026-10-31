import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "BetterSide",
  description: "Explore issues, find responses, and contribute.",
  icons: {
    icon: { url: "/betterside.svg", type: "image/svg+xml" },
    apple: { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
  },
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
