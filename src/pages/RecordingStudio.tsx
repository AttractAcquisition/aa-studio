import { useState, useRef, useCallback, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Video,
  Camera,
  Square,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Wand2,
  Scissors,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RecordingState = "idle" | "recording" | "paused" | "preview";

export default function RecordingStudio() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPermissionDenied(false);
    } catch (error) {
      console.error("Camera access denied:", error);
      setPermissionDenied(true);
      toast.error("Camera access denied. Please enable camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm",
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      setRecordingState("preview");
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000);
    setRecordingState("recording");
    setDuration(0);

    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [recordingState]);

  const resetRecording = useCallback(() => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingState("idle");
    setDuration(0);
    startCamera();
  }, [recordedUrl, startCamera]);

  const handleUpload = async () => {
    if (!user || !recordedBlob) return;

    setIsUploading(true);
    try {
      const filename = `${Date.now()}.webm`;
      const path = `${user.id}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from("aa-videos")
        .upload(path, recordedBlob, {
          contentType: "video/webm",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("videos").insert({
        user_id: user.id,
        title: title || `Recording ${new Date().toLocaleDateString()}`,
        path,
        bucket: "aa-videos",
        mime: "video/webm",
        bytes: recordedBlob.size,
        platform: "instagram",
      });

      if (dbError) throw dbError;

      toast.success("Video uploaded successfully!");
      resetRecording();
      setTitle("");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload video");
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (previewRef.current && recordedUrl && recordingState === "preview") {
      previewRef.current.src = recordedUrl;
    }
  }, [recordedUrl, recordingState]);

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="aa-pill-primary mb-4">Recording Studio</div>
          <h1 className="aa-headline-lg text-foreground">
            Record <span className="aa-gradient-text">Video</span>
          </h1>
          <p className="aa-body mt-2">
            Record videos directly from your browser and upload to your vault.
          </p>
        </div>

        {permissionDenied ? (
          <div className="aa-card text-center py-12">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="font-bold text-foreground mb-2">Camera Access Denied</h3>
            <p className="text-muted-foreground mb-4">
              Please enable camera and microphone permissions in your browser settings.
            </p>
            <Button variant="gradient" onClick={startCamera}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Video Preview */}
            <div className="aa-card">
              <div className="aspect-[9/16] max-h-[60vh] mx-auto rounded-2xl overflow-hidden bg-black relative">
                {recordingState === "preview" && recordedUrl ? (
                  <video
                    ref={previewRef}
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                  />
                ) : (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                )}

                {recordingState === "recording" && (
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white font-mono text-sm bg-black/50 px-2 py-1 rounded">
                      {formatTime(duration)}
                    </span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mt-6">
                {recordingState === "idle" && (
                  <Button variant="gradient" size="lg" onClick={startRecording}>
                    <Camera className="w-5 h-5 mr-2" />
                    Start Recording
                  </Button>
                )}

                {recordingState === "recording" && (
                  <Button variant="destructive" size="lg" onClick={stopRecording}>
                    <Square className="w-5 h-5 mr-2" />
                    Stop Recording
                  </Button>
                )}

                {recordingState === "preview" && (
                  <>
                    <Button variant="outline" size="lg" onClick={resetRecording}>
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Record Again
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Upload Section */}
            {recordingState === "preview" && recordedBlob && (
              <div className="aa-card space-y-4">
                <h3 className="font-bold text-foreground">Save Recording</h3>

                <div>
                  <Label className="text-muted-foreground mb-2 block">Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter video title..."
                    className="h-12"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="gradient"
                    className="flex-1"
                    onClick={handleUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload to Vault
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => toast.info("AI editing coming soon!")}
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    AI Edit
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => toast.info("Trimming coming soon!")}
                  >
                    <Scissors className="w-4 h-4 mr-2" />
                    Trim
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Duration: {formatTime(duration)} • Size: {(recordedBlob.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
