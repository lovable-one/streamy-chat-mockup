
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

interface LoadingIndicatorProps {
  className?: string;
}

export function LoadingIndicator({ className }: LoadingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Thinking...</span>
    </div>
  );
}
