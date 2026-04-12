import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { AAVideoRender } from "@/types/video-generator";

interface RecentRendersProps {
  renders: AAVideoRender[];
  onOpen?: (render: AAVideoRender) => void;
}

const statusColors: Record<string, string> = {
  queued: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  rendering: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  done: "bg-green-500/10 text-green-500 border-green-500/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
};

export function RecentRenders({ renders, onOpen }: RecentRendersProps) {
  if (renders.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Recent Renders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No renders yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Recent Renders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {renders.slice(0, 10).map((render) => (
          <div 
            key={render.id}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Badge variant="outline" className={statusColors[render.status]}>
                {render.status}
              </Badge>
              <span className="text-xs text-muted-foreground truncate">
                {formatDistanceToNow(new Date(render.created_at), { addSuffix: true })}
              </span>
            </div>
            {render.status === "done" && render.video_url && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => onOpen?.(render)}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
