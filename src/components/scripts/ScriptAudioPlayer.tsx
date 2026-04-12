import { useState, useRef, useEffect } from "react";
import { Mic, Play, Pause, Square, Trash2, Volume2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ScriptAudioPlayerProps {
  audioUrl: string | null;
  audioDuration: number | null;
  isUploading?: boolean;
  isGeneratingTTS?: boolean;
  onRecord: (blob: Blob, duration: number) => Promise<void>;
  onDelete: () => Promise<void>;
  onGenerateTTS: () => void;
}

export function ScriptAudioPlayer({
  audioUrl,
  audioDuration,
  isUploading,
  isGeneratingTTS,
  onRecord,
  onDelete,
  onGenerateTTS,
}: ScriptAudioPlayerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [showRecorder, setShowRecorder] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);
    } catch (err) {
      console.error("Mic access error:", err);
      toast.error("Could not access microphone. Please allow microphone permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    setShowRecorder(false);
    setRecordingDuration(0);
  };

  const saveRecording = async () => {
    if (!recordedBlob) return;
    await onRecord(recordedBlob, recordingDuration);
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    setShowRecorder(false);
    setRecordingDuration(0);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setPlaybackTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setPlaybackTime(0);
  };

  const handleDeleteAudio = async () => {
    await onDelete();
    setPlaybackTime(0);
    setIsPlaying(false);
  };

  // If we have saved audio, show the player
  if (audioUrl && !showRecorder) {
    return (
      <div className="space-y-2">
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          preload="metadata"
        />
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary hover:bg-primary/10"
            onClick={togglePlayback}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <div className="flex-1 flex items-center gap-2">
            <div className="h-1 flex-1 bg-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-100"
                style={{ 
                  width: `${audioDuration ? (playbackTime / audioDuration) * 100 : 0}%` 
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground min-w-[40px]">
              {formatTime(playbackTime)} / {formatTime(audioDuration || 0)}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowRecorder(true)}
            title="Re-record"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={handleDeleteAudio}
            title="Delete audio"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-primary/30 text-primary hover:bg-primary/10"
            onClick={onGenerateTTS}
            disabled={isGeneratingTTS}
          >
            <Volume2 className="h-3.5 w-3.5 mr-1" />
            {isGeneratingTTS ? "Generating..." : "Generate TTS"}
          </Button>
        </div>
      </div>
    );
  }

  // Recording UI
  if (showRecorder || isRecording || recordedBlob) {
    return (
      <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border">
        {isRecording ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium text-foreground">Recording...</span>
              <span className="text-sm text-muted-foreground">{formatTime(recordingDuration)}</span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={stopRecording}
            >
              <Square className="h-3.5 w-3.5 mr-1" />
              Stop
            </Button>
          </div>
        ) : recordedBlob ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <audio src={recordedUrl || undefined} controls className="h-8 flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                className="bg-primary hover:bg-primary/90"
                onClick={saveRecording}
                disabled={isUploading}
              >
                {isUploading ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelRecording}
                disabled={isUploading}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="bg-primary hover:bg-primary/90"
              onClick={startRecording}
            >
              <Mic className="h-3.5 w-3.5 mr-1" />
              Start Recording
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRecorder(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    );
  }

  // No audio - show record + TTS buttons
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Add audio for this script</p>
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-primary/30 text-primary hover:bg-primary/10"
          onClick={() => setShowRecorder(true)}
        >
          <Mic className="h-3.5 w-3.5 mr-1" />
          Record
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-primary/30 text-primary hover:bg-primary/10"
          onClick={onGenerateTTS}
          disabled={isGeneratingTTS}
        >
          <Volume2 className="h-3.5 w-3.5 mr-1" />
          {isGeneratingTTS ? "Generating..." : "Generate TTS"}
        </Button>
      </div>
    </div>
  );
}