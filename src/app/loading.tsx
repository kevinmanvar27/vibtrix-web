import { Loader2 } from "lucide-react";

export default function Loading() {
  // Minimal loading indicator - appears only briefly during navigation
  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] h-1 bg-primary/20">
      <div className="h-full bg-primary animate-pulse" style={{ width: '30%' }} />
    </div>
  );
}
