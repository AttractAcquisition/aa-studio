import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Video,
  Loader2,
  Trash2,
  Copy,
  Play,
  FileVideo,
  Download,
  Mic,
  MicOff,
  RefreshCw,
} from "lucide-react";
import { useVideos, VideoRow } from "@/hooks/useVideos";
import { toast } from "sonner";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

const platforms = ["instagram", "tiktok", "linkedin", "youtube", "twitter", "other"];

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function Videos() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<VideoRow | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Upload form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    videos,
    isLoading,
    uploadVideo,
    deleteVideo,
    isUploading,
    getSignedUrl,
    copySignedUrl,
    signedUrls,
    refetch,
  } = useVideos();

  // Load preview URL when video is selected
  useEffect(() => {
    if (previewVideo) {
      getSignedUrl(previewVideo).then(setPreviewUrl).catch(console.error);
    } else {
      setPreviewUrl(null);
    }
  }, [previewVideo, getSignedUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-fill title from filename if empty
      if (!title) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error("Please select a video file");
      return;
    }
    
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    try {
      // Simulate progress (actual progress would need XHR)
      setUploadProgress(10);
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await uploadVideo({
        file,
        title: title.trim(),
        description: description.trim() || undefined,
        platform,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast.success("Video uploaded successfully!");
      resetForm();
      setUploadModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload video");
    } finally {
      setUploadProgress(0);
    }
  };

  const handleDelete = async (video: VideoRow) => {
    if (!confirm(`Delete "${video.title}"? This cannot be undone.`)) return;
    
    try {
      await deleteVideo(video);
      toast.success("Video deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete video");
    }
  };

  const handleCopyLink = async (video: VideoRow) => {
    try {
      await copySignedUrl(video);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPlatform("instagram");
    setFile(null);
    setUploadProgress(0);
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="aa-pill-primary mb-4">Videos</div>
            <h1 className="aa-headline-lg text-foreground">
              Video <span className="aa-gradient-text">Vault</span>
            </h1>
            <p className="aa-body mt-2">
              Upload and manage your video content assets.
            </p>
          </div>
          <Button variant="gradient" onClick={() => setUploadModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Video
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
          <div className="aa-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-3 flex items-center justify-center">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-black text-foreground">{videos.length}</p>
            <p className="text-sm text-muted-foreground">Total Videos</p>
          </div>
          <div className="aa-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-3 flex items-center justify-center">
              <FileVideo className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-black text-foreground">
              {formatBytes(videos.reduce((sum, v) => sum + (v.bytes || 0), 0))}
            </p>
            <p className="text-sm text-muted-foreground">Total Size</p>
          </div>
          <div className="aa-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-3 flex items-center justify-center">
              <Play className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-black text-foreground">
              {videos.filter((v) => v.platform === "instagram").length}
            </p>
            <p className="text-sm text-muted-foreground">Instagram Videos</p>
          </div>
        </div>

        {/* Videos Grid */}
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-4">Loading videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
              <Video className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">No videos yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload your first video to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, index) => (
              <VideoCard
                key={video.id}
                video={video}
                signedUrl={signedUrls[video.id]}
                onPreview={() => setPreviewVideo(video)}
                onCopyLink={() => handleCopyLink(video)}
                onDelete={() => handleDelete(video)}
                index={index}
                getSignedUrl={getSignedUrl}
                onRefresh={refetch}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Upload Video</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpload} className="space-y-4 mt-4">
            <div>
              <Label className="text-muted-foreground">Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Video title..."
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-muted-foreground">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                className="mt-1"
                rows={2}
              />
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

            <div>
              <Label className="text-muted-foreground">Video File *</Label>
              <Input
                type="file"
                accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                onChange={handleFileChange}
                className="mt-1"
                required
              />
              {file && (
                <p className="text-xs text-muted-foreground mt-1">
                  {file.name} ({formatBytes(file.size)})
                </p>
              )}
            </div>

            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadModalOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={isUploading || !file}>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewVideo} onOpenChange={() => setPreviewVideo(null)}>
        <DialogContent className="sm:max-w-[800px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {previewVideo?.title}
            </DialogTitle>
          </DialogHeader>
          
          {previewUrl ? (
            <video
              src={previewUrl}
              controls
              className="w-full rounded-lg mt-4"
              autoPlay
            />
          ) : (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          
          {previewVideo && (
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              {previewVideo.description && <p>{previewVideo.description}</p>}
              <div className="flex gap-4">
                <span>Platform: {previewVideo.platform}</span>
                <span>Size: {formatBytes(previewVideo.bytes)}</span>
                <span>Uploaded: {format(new Date(previewVideo.created_at), "MMM d, yyyy")}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// Separate component for video cards to handle async URL loading
function VideoCard({
  video,
  signedUrl,
  onPreview,
  onCopyLink,
  onDelete,
  index,
  getSignedUrl,
  onRefresh,
}: {
  video: VideoRow;
  signedUrl?: string;
  onPreview: () => void;
  onCopyLink: () => void;
  onDelete: () => void;
  index: number;
  getSignedUrl: (video: VideoRow) => Promise<string>;
  onRefresh: () => void;
}) {
  const [url, setUrl] = useState<string | null>(signedUrl || null);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (!url && !signedUrl) {
      getSignedUrl(video).then(setUrl).catch(console.error);
    }
  }, [video, signedUrl, url, getSignedUrl]);

  const isWebm = video.mime?.includes("webm") || video.path.endsWith(".webm");

  const handleConvertToMp4 = async () => {
    if (!isWebm) return;
    
    setIsConverting(true);
    try {
      toast.info("Converting video to MP4... This may take a moment.");
      
      const { data, error } = await supabase.functions.invoke("convert-video", {
        body: {
          videoId: video.id,
          userId: video.user_id,
          bucket: video.bucket,
          path: video.path,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Video converted to MP4 successfully!");
        onRefresh();
        // Clear cached URL so it reloads
        setUrl(null);
      } else {
        throw new Error(data?.error || "Conversion failed");
      }
    } catch (error: any) {
      console.error("Conversion error:", error);
      toast.error(error.message || "Failed to convert video");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div
      className="aa-card group animate-fade-in overflow-hidden"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Video Preview */}
      <div
        className="relative aspect-video bg-secondary rounded-xl mb-4 overflow-hidden cursor-pointer"
        onClick={onPreview}
      >
        {url ? (
          <video
            src={url}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-12 h-12 text-white" />
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2">
        <h3 className="font-bold text-foreground truncate">{video.title}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="aa-pill-outline text-[10px]">{video.platform}</span>
          <span className="text-xs text-muted-foreground">
            {formatBytes(video.bytes)}
          </span>
          {/* Codec badge */}
          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
            video.mime?.includes("mp4") 
              ? "bg-green-500/10 text-green-500" 
              : "bg-yellow-500/10 text-yellow-500"
          }`}>
            {video.mime?.includes("mp4") ? "MP4 (H.264)" : video.mime?.includes("webm") ? "WebM (VP9)" : video.mime || "Unknown"}
          </span>
          {/* Audio badge */}
          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
            video.has_audio !== false 
              ? "bg-primary/10 text-primary" 
              : "bg-destructive/10 text-destructive"
          }`}>
            {video.has_audio !== false ? (
              <><Mic className="w-3 h-3" /> Audio</>
            ) : (
              <><MicOff className="w-3 h-3" /> No Audio</>
            )}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {format(new Date(video.created_at), "MMM d, yyyy")}
        </p>
        {video.has_audio === false && (
          <p className="text-[10px] text-yellow-500">
            ⚠️ Re-record with mic for captions
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onCopyLink}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={async () => {
              try {
                const downloadUrl = url || await getSignedUrl(video);
                const response = await fetch(downloadUrl);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = blobUrl;
                // Use correct extension based on actual mime type
                const extension = video.mime?.includes("webm") ? "webm" : video.mime?.includes("mp4") ? "mp4" : video.path.split(".").pop() || "mp4";
                a.download = `${video.title}.${extension}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
                toast.success("Download started!");
              } catch (error) {
                toast.error("Failed to download video");
              }
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Convert to MP4 button - only show for WebM videos */}
        {isWebm && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={handleConvertToMp4}
            disabled={isConverting}
          >
            {isConverting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Convert to MP4
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
