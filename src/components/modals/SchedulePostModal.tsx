import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { toast } from "sonner";

interface SchedulePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editPost?: {
    id: string;
    title: string;
    post_type: string;
    scheduled_for: string;
    platform?: string;
    notes?: string;
    status?: string;
  };
}

const postTypes = ["Reel", "Carousel", "One-Pager", "Proof Card"];
const platforms = ["instagram", "tiktok", "linkedin", "twitter"];

export function SchedulePostModal({ open, onOpenChange, editPost }: SchedulePostModalProps) {
  const [title, setTitle] = useState(editPost?.title || "");
  const [postType, setPostType] = useState(editPost?.post_type || "");
  const [scheduledFor, setScheduledFor] = useState(
    editPost?.scheduled_for ? new Date(editPost.scheduled_for).toISOString().slice(0, 16) : ""
  );
  const [platform, setPlatform] = useState(editPost?.platform || "instagram");
  const [notes, setNotes] = useState(editPost?.notes || "");

  const { createScheduledPost, updateScheduledPost, deleteScheduledPost, isCreating } = useScheduledPosts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !postType || !scheduledFor) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editPost) {
        updateScheduledPost({
          id: editPost.id,
          title,
          post_type: postType,
          scheduled_for: new Date(scheduledFor).toISOString(),
          notes: notes || undefined,
        });
        toast.success("Post updated!");
      } else {
        await createScheduledPost({
          title,
          post_type: postType,
          scheduled_for: new Date(scheduledFor).toISOString(),
          platform,
          notes: notes || undefined,
        });
        toast.success("Post scheduled!");
      }
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save post");
    }
  };

  const handleDelete = () => {
    if (editPost) {
      deleteScheduledPost(editPost.id);
      toast.success("Post deleted");
      onOpenChange(false);
    }
  };

  const handleMarkPublished = () => {
    if (editPost) {
      updateScheduledPost({ id: editPost.id, status: "published" });
      toast.success("Marked as published!");
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setPostType("");
    setScheduledFor("");
    setPlatform("instagram");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {editPost ? "Edit Scheduled Post" : "Schedule Post"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label className="text-muted-foreground">Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title..."
              className="mt-1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Post Type *</Label>
              <Select value={postType} onValueChange={setPostType}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {postTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select platform..." />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Schedule For *</Label>
            <Input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label className="text-muted-foreground">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              {editPost && (
                <>
                  <Button type="button" variant="destructive" onClick={handleDelete}>
                    Delete
                  </Button>
                  {editPost.status !== "published" && (
                    <Button type="button" variant="outline" onClick={handleMarkPublished}>
                      Mark Published
                    </Button>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editPost ? (
                  "Update"
                ) : (
                  "Schedule"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
