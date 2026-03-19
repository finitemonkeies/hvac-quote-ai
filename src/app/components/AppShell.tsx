import type { PropsWithChildren } from "react";
import { cn } from "./ui/utils";

interface AppShellProps extends PropsWithChildren {
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <div className={cn("mx-auto min-h-screen max-w-6xl px-4 pb-10 sm:px-6", className)}>
        {children}
      </div>
    </div>
  );
}
