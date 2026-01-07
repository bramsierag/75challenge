import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "75 Challenge PWA",
  description: "Next.js PWA met Postgres",
  manifest: "/manifest.json",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
