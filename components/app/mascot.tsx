import Image from "next/image";

import { cn } from "@/lib/utils";

export type MascotPose =
  | "welcome"
  | "waiting"
  | "sad"
  | "celebration"
  | "encouragement"
  | "neutral"
  | "icon";

type MascotSize = "sm" | "md" | "lg" | "xl";

const mascotDimensions: Record<MascotSize, string> = {
  sm: "h-10 w-10",
  md: "h-20 w-20",
  lg: "h-32 w-32",
  xl: "h-44 w-44 sm:h-52 sm:w-52",
};

export function Mascot({
  pose,
  size = "md",
  animate = false,
  float = false,
  centered = false,
  priority = false,
  className,
}: {
  pose: MascotPose;
  size?: MascotSize;
  animate?: boolean;
  float?: boolean;
  centered?: boolean;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none select-none",
        centered && "mx-auto flex justify-center",
        animate && "animate-mascot-pop",
        float && "animate-mascot-float",
        className
      )}
      aria-hidden="true"
    >
      <Image
        src={`/mascot/${pose}.png`}
        alt=""
        width={220}
        height={220}
        priority={priority}
        className={cn("object-contain drop-shadow-[0_16px_30px_rgba(118,80,255,0.18)]", mascotDimensions[size])}
      />
    </div>
  );
}
