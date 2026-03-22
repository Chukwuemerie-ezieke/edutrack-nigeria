import { useEffect, useState } from "react";
import { useLiveData } from "@/hooks/use-live-data";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

interface StatusResponse {
  timestamp: string;
  sources: Array<{
    name: string;
    type: string;
    status: string;
    statusLabel: string;
  }>;
}

function useTimeAgo(isoString: string | undefined) {
  const [label, setLabel] = useState("–");

  useEffect(() => {
    if (!isoString) return;
    function update() {
      const diffSec = Math.floor((Date.now() - new Date(isoString!).getTime()) / 1000);
      if (diffSec < 5) setLabel("just now");
      else if (diffSec < 60) setLabel(`${diffSec}s ago`);
      else setLabel(`${Math.floor(diffSec / 60)}m ago`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isoString]);

  return label;
}

export function LiveFeedBanner() {
  const { data, isFetching, isError, dataUpdatedAt } = useLiveData<StatusResponse>(
    "/api/live/status",
    60000
  );

  const lastSyncedAt = dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : undefined;
  const timeAgo = useTimeAgo(lastSyncedAt);

  const activeCount = data?.sources.filter(s => s.status === "active").length ?? 0;
  const cachedCount = data?.sources.filter(s => s.status === "cached" || s.status === "available").length ?? 0;

  const isLive = !isError && !!data;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-1.5 text-xs border-b border-border/60 transition-colors ${
        isLive
          ? "bg-emerald-50/80 dark:bg-emerald-900/10"
          : "bg-destructive/5"
      }`}
      data-testid="live-feed-banner"
      aria-live="polite"
    >
      {/* Live indicator */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isLive ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-[10px]">
              LIVE
            </span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 text-destructive" />
            <span className="font-semibold text-destructive uppercase tracking-wider text-[10px]">
              OFFLINE
            </span>
          </>
        )}
      </div>

      <span className="text-muted-foreground/60">·</span>

      {/* Last synced */}
      <span className="text-muted-foreground">
        Last synced:{" "}
        <span className="font-medium text-foreground">{timeAgo}</span>
      </span>

      {/* Refreshing indicator */}
      {isFetching && (
        <>
          <span className="text-muted-foreground/60">·</span>
          <span className="flex items-center gap-1 text-muted-foreground italic">
            <RefreshCw className="h-3 w-3 animate-spin" />
            refreshing…
          </span>
        </>
      )}

      {/* Source status */}
      {isLive && (
        <>
          <span className="text-muted-foreground/60">·</span>
          <span className="text-muted-foreground hidden sm:inline">
            Data Sources:{" "}
            <span className="font-medium text-emerald-700 dark:text-emerald-400">{activeCount} Active</span>
            <span className="text-muted-foreground/60">, </span>
            <span className="font-medium text-foreground">{cachedCount} Cached</span>
          </span>
        </>
      )}

      <div className="ml-auto flex items-center gap-1 text-muted-foreground/60 hidden lg:flex">
        <Wifi className="h-3 w-3" />
        <span>EduTrack Live Feed</span>
      </div>
    </div>
  );
}
