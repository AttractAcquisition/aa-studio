import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGrowthMetricMutation } from "@/hooks/useGrowthMetrics";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface UpdateMetricsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateMetricsModal({ open, onOpenChange }: UpdateMetricsModalProps) {
  const { toast } = useToast();
  const mutation = useGrowthMetricMutation();
  
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [followers, setFollowers] = useState("");
  const [profileVisits, setProfileVisits] = useState("");
  const [linkClicks, setLinkClicks] = useState("");
  const [inboundDms, setInboundDms] = useState("");
  const [bookedCalls, setBookedCalls] = useState("");

  const handleSave = async () => {
    try {
      await mutation.mutateAsync({
        date,
        followers: followers ? parseInt(followers, 10) : null,
        profile_visits: profileVisits ? parseInt(profileVisits, 10) : null,
        link_clicks: linkClicks ? parseInt(linkClicks, 10) : null,
        inbound_dms: inboundDms ? parseInt(inboundDms, 10) : null,
        booked_calls: bookedCalls ? parseInt(bookedCalls, 10) : null,
      });

      toast({
        title: "Metrics saved",
        description: `Updated metrics for ${date}`,
      });

      onOpenChange(false);
      
      // Reset form
      setFollowers("");
      setProfileVisits("");
      setLinkClicks("");
      setInboundDms("");
      setBookedCalls("");
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to save metrics",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Metrics</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="followers">Followers (Total)</Label>
            <Input
              id="followers"
              type="number"
              placeholder="e.g. 12500"
              value={followers}
              onChange={(e) => setFollowers(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile_visits">Profile Visits</Label>
            <Input
              id="profile_visits"
              type="number"
              placeholder="e.g. 250"
              value={profileVisits}
              onChange={(e) => setProfileVisits(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link_clicks">Link Clicks</Label>
            <Input
              id="link_clicks"
              type="number"
              placeholder="e.g. 45"
              value={linkClicks}
              onChange={(e) => setLinkClicks(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inbound_dms">Inbound DMs</Label>
            <Input
              id="inbound_dms"
              type="number"
              placeholder="e.g. 12"
              value={inboundDms}
              onChange={(e) => setInboundDms(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="booked_calls">Booked Calls</Label>
            <Input
              id="booked_calls"
              type="number"
              placeholder="e.g. 3"
              value={bookedCalls}
              onChange={(e) => setBookedCalls(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
