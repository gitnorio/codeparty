"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export function ProfileAvatar({
  name,
  avatarUrl,
  className,
  initialsClassName,
  alt,
}: {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  initialsClassName?: string;
  alt?: string;
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={alt ?? `${name} avatar`}
        width={64}
        height={64}
        className={cn("rounded-full object-cover", className)}
        unoptimized
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-[#e9e0ff] text-sm font-semibold text-[#7650ff] dark:bg-[#272138] dark:text-[#9b8cff]",
        className,
        initialsClassName
      )}
      aria-label={alt ?? `${name} avatar`}
    >
      {getInitials(name)}
    </div>
  );
}
