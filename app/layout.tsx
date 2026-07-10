import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeParty",
  description: "Collaborative project platform for junior developers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full font-sans antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
