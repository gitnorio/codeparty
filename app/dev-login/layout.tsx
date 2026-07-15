import { notFound } from "next/navigation";

export default function DevLoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isEnabled =
    process.env.NODE_ENV !== "production" ||
    process.env.DEV_LOGIN_ENABLED === "true";

  if (!isEnabled) {
    notFound();
  }

  return children;
}
