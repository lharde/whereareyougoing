import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Semester Abroad Map",
  description: "Collect and share semester abroad destinations."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
