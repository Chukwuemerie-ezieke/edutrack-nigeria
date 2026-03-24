import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      data-testid="offline-banner"
      className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-400 dark:bg-yellow-500 text-yellow-900 text-sm font-medium w-full z-50"
    >
      <WifiOff className="h-4 w-4 flex-shrink-0" />
      <span>You're offline — data will sync when connection returns</span>
    </div>
  );
}
