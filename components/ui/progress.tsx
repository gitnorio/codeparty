import * as React from "react";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value = 0,
  ...props
}: React.ComponentProps<"div"> & { value?: number }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div
      data-slot="progress"
      className={cn("relative h-3 w-full overflow-hidden rounded-full bg-[#ece8f8]", className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#7650ff_0%,#9f84ff_100%)] transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

export { Progress };
