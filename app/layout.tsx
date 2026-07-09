import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeParty",
  description: "Plateforme de projets collaboratifs pour développeurs juniors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full font-sans antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
