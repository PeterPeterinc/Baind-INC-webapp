import * as React from "react";

import { cn } from "@/lib/utils";

function Input({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "placeholder:text-gray-400 h-9 w-full min-w-0 rounded-md border border-gray-200 bg-white px-3 py-1 text-base text-black shadow-none transition outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus:border-black focus:ring-2 focus:ring-black/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
