import { useState, useRef, useCallback, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Video,
  Camera,
  Square,
  Upload,
  RotateCcw,
  Wand2,
  Scissors,
  Loader2,
  AlertTriangle,
  Monitor,
  Mic,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RecordingState = "idle" | "recording" | "paused" | "preview";
type RecordingMode = "camera" | "screen";

type DeviceInfo = {
  deviceId: string;
  label: string;
};

type AspectRatioOption = {
  label: string;
  value: string;
  width: number;
  height: number;
  aspectClass: string;
};

const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  { label: "9:16 (1080×1920)", value: "9:16", width: 1080, height: 1920, aspectClass: "aspect-[9/16]" },
  { label: "4:5 (1080×1350)", value: "4:5", width: 1080, height: 1350, aspectClass: "aspect-[4/5]" },
  { label: "1:1 (1080×1080)", value: "1:1", width: 1080, height: 1080, aspectClass: "aspect-square" },
  { label: "16:9 (1920×1080)", value: "16:9", width: 1920, height: 1080, aspectClass: "aspect-video" },
];

export default function RecordingStudio() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingMode, setRecordingMode] = useState<RecordingMode>("camera");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [duration, setDuration] = useState(0);
  const [hasAudio, setHasAudio] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Device selection
  const [videoDevices, setVideoDevices] = useState<DeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<DeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  
  // Aspect ratio selection
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>("9:16");
  const currentRatio = ASPECT_RATIO_OPTIONS.find(r => r.value === selectedAspectRatio) || ASPECT_RATIO_OPTIONS[0];

  // Enumerate available devices
  const enumerateDevices = useCallback(async () => {
    try {
      // Request permissions first to get device labels
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const videoInputs = devices
        .filter((d) => d.kind === "videoinput")
        .map((d) => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 8)}` }));
      
      const audioInputs = devices
        .filter((d) => d.kind === "audioinput")
        .map((d) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 8)}` }));
      
      setVideoDevices(videoInputs);
      setAudioDevices(audioInputs);
      
      // Set defaults from localStorage or first device
      const savedVideo = localStorage.getItem("aa-video-device");
      const savedAudio = localStorage.getItem("aa-audio-device");
      
      if (savedVideo && videoInputs.find((d) => d.deviceId === savedVideo)) {
        setSelectedVideoDevice(savedVideo);
      } else if (videoInputs.length > 0) {
        setSelectedVideoDevice(videoInputs[0].deviceId);
      }
      
      if (savedAudio && audioInputs.find((d) => d.deviceId === savedAudio)) {
        setSelectedAudioDevice(savedAudio);
      } else if (audioInputs.length > 0) {
        setSelectedAudioDevice(audioInputs[0].deviceId);
      }
    } catch (error) {
      console.error("Error enumerating devices:", error);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      stopCamera();
      
      const constraints: MediaStreamConstraints = {
        video: selectedVideoDevice
          ? { deviceId: { exact: selectedVideoDevice }, width: { ideal: 1080 }, height: { ideal: 1920 } }
          : { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: selectedAudioDevice
          ? { 
              deviceId: { exact: selectedAudioDevice },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Check if audio is present
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        toast.warning("No microphone audio detected. Recording will have no sound.");
        setHasAudio(false);
      } else {
        setHasAudio(true);
        console.log("Audio track active:", audioTracks[0].label);
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPermissionDenied(false);
    } catch (error) {
      console.error("Camera access denied:", error);
      setPermissionDenied(true);
      toast.error("Camera access denied. Please enable camera permissions.");
    }
  }, [selectedVideoDevice, selectedAudioDevice]);

  const startScreenCapture = useCallback(async () => {
    try {
      stopCamera();
      
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true,
      });
      
      // Also capture microphone audio if selected
      let audioStream: MediaStream | null = null;
      if (selectedAudioDevice) {
        try {
          audioStream = await navigator.mediaDevices.getUserMedia({
            audio: { 
              deviceId: { exact: selectedAudioDevice },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        } catch {
          // Continue without mic if it fails
        }
      }
      
      // Combine streams
      const tracks = [...displayStream.getVideoTracks()];
      let audioTrackCount = 0;
      if (displayStream.getAudioTracks().length > 0) {
        tracks.push(...displayStream.getAudioTracks());
        audioTrackCount += displayStream.getAudioTracks().length;
      }
      if (audioStream) {
        tracks.push(...audioStream.getAudioTracks());
        audioTrackCount += audioStream.getAudioTracks().length;
      }
      
      // Check if audio is present
      if (audioTrackCount === 0) {
        toast.warning("No audio detected. Recording will have no sound.");
        setHasAudio(false);
      } else {
        setHasAudio(true);
      }
      
      const combinedStream = new MediaStream(tracks);
      streamRef.current = combinedStream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = combinedStream;
      }
      
      // Handle user stopping screen share
      displayStream.getVideoTracks()[0].onended = () => {
        if (recordingState === "recording") {
          stopRecording();
        } else {
          stopCamera();
          setRecordingMode("camera");
        }
      };
      
      setPermissionDenied(false);
    } catch (error) {
      console.error("Screen capture denied:", error);
      toast.error("Screen capture was cancelled or denied.");
      setRecordingMode("camera");
    }
  }, [selectedAudioDevice]);

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
    
    // Prefer MP4 if supported (Safari), otherwise use WebM
    let mimeType = "video/webm";
    if (MediaRecorder.isTypeSupported("video/mp4")) {
      mimeType = "video/mp4";
    } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
      mimeType = "video/webm;codecs=vp9";
    }
    
    console.log("Recording with mimeType:", mimeType);
    
    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const actualMime = mimeType.includes("mp4") ? "video/mp4" : "video/webm";
      const blob = new Blob(chunksRef.current, { type: actualMime });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      setRecordingState("preview");

      if (actualMime === "video/webm") {
        toast.message("Saved as WebM", {
          description:
            "This browser can't record MP4 directly. Download will be .webm unless you convert with an external transcoder.",
        });
      }
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
    if (recordingMode === "camera") {
      startCamera();
    } else {
      startScreenCapture();
    }
  }, [recordedUrl, recordingMode, startCamera, startScreenCapture]);

  const handleUpload = async () => {
    if (!user || !recordedBlob) return;

    setIsUploading(true);
    try {
      // Detect actual mime type from blob
      const isMP4 = recordedBlob.type.includes("mp4");
      const extension = isMP4 ? "mp4" : "webm";
      const mimeType = isMP4 ? "video/mp4" : "video/webm";
      
      const filename = `${Date.now()}.${extension}`;
      const path = `${user.id}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from("aa-videos")
        .upload(path, recordedBlob, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: insertData, error: dbError } = await supabase.from("videos").insert({
        user_id: user.id,
        title: title || `Recording ${new Date().toLocaleDateString()}`,
        path,
        bucket: "aa-videos",
        mime: mimeType,
        bytes: recordedBlob.size,
        platform: "instagram",
        has_audio: hasAudio,
        // Store aspect ratio metadata in description as JSON
        description: JSON.stringify({ aspect_ratio: selectedAspectRatio, resolution: `${currentRatio.width}x${currentRatio.height}` }),
      }).select().single();

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

  const handleVideoDeviceChange = (deviceId: string) => {
    setSelectedVideoDevice(deviceId);
    localStorage.setItem("aa-video-device", deviceId);
  };

  const handleAudioDeviceChange = (deviceId: string) => {
    setSelectedAudioDevice(deviceId);
    localStorage.setItem("aa-audio-device", deviceId);
  };

  const handleModeChange = (mode: RecordingMode) => {
    setRecordingMode(mode);
    if (mode === "camera") {
      startCamera();
    } else {
      startScreenCapture();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    enumerateDevices();
  }, [enumerateDevices]);

  useEffect(() => {
    if (selectedVideoDevice || selectedAudioDevice) {
      if (recordingMode === "camera") {
        startCamera();
      }
    }
    return () => {
      stopCamera();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [selectedVideoDevice, selectedAudioDevice]);

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
            {/* Mode & Device Selectors */}
            {recordingState === "idle" && (
              <div className="aa-card">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Recording Mode */}
                  <div>
                    <Label className="text-muted-foreground mb-2 block">Recording Mode</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={recordingMode === "camera" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => handleModeChange("camera")}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Camera
                      </Button>
                      <Button
                        variant={recordingMode === "screen" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => handleModeChange("screen")}
                      >
                        <Monitor className="w-4 h-4 mr-2" />
                        Screen
                      </Button>
                    </div>
                  </div>

                  {/* Camera Selector */}
                  {recordingMode === "camera" && videoDevices.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground mb-2 block">Camera</Label>
                      <Select value={selectedVideoDevice} onValueChange={handleVideoDeviceChange}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select camera..." />
                        </SelectTrigger>
                        <SelectContent>
                          {videoDevices.map((device) => (
                            <SelectItem key={device.deviceId} value={device.deviceId}>
                              {device.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                {/* Microphone Selector */}
                  {audioDevices.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground mb-2 block">Microphone</Label>
                      <Select value={selectedAudioDevice} onValueChange={handleAudioDeviceChange}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select microphone..." />
                        </SelectTrigger>
                        <SelectContent>
                          {audioDevices.map((device) => (
                            <SelectItem key={device.deviceId} value={device.deviceId}>
                              {device.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                {/* Aspect Ratio Selector */}
                <div className="mt-4">
                  <Label className="text-muted-foreground mb-2 block">Aspect Ratio</Label>
                  <Select value={selectedAspectRatio} onValueChange={setSelectedAspectRatio}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select aspect ratio..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIO_OPTIONS.map((ratio) => (
                        <SelectItem key={ratio.value} value={ratio.value}>
                          {ratio.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    This crops the preview + export frame. Source camera may vary.
                  </p>
                </div>
              </div>
            )}

            {/* Video Preview */}
            <div className="aa-card">
              <div className={`${recordingMode === "screen" ? "aspect-video" : currentRatio.aspectClass} max-h-[60vh] mx-auto rounded-2xl overflow-hidden bg-black relative`}>
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
                    {recordingMode === "camera" ? (
                      <Camera className="w-5 h-5 mr-2" />
                    ) : (
                      <Monitor className="w-5 h-5 mr-2" />
                    )}
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
                  <Button variant="outline" size="lg" onClick={resetRecording}>
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Record Again
                  </Button>
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