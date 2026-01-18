import React, { useState, useRef, useEffect } from "react";
import { Mic, Loader2, StopCircle } from "lucide-react";
import { elevenLabsService } from "../lib/elevenlabs";
import { useTranslation } from "react-i18next";

interface VoiceControlProps {
  onTranscription: (text: string) => void;
}

export const VoiceControl: React.FC<VoiceControlProps> = ({
  onTranscription,
}) => {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Load selected device from storage
  useEffect(() => {
    chrome.storage.local.get(["selectedDeviceId"], (result) => {
      setSelectedDeviceId((result.selectedDeviceId as string) || "");
    });
  }, []);

  const startRecording = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId
          ? {
              deviceId: { exact: selectedDeviceId },
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: true,
              sampleRate: 48000,
            }
          : {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: true,
              sampleRate: 48000,
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Setup MediaRecorder
      let mimeType = "audio/webm;codecs=opus";
      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];

      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: mimeType,
        });
        stream.getTracks().forEach((track) => track.stop());
        await transcribeAudio(audioBlob, mimeType);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Failed to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    try {
      const text = await elevenLabsService.speechToText({
        audioBlob,
        mimeType,
        languageCode: "en",
      });

      if (text.trim()) {
        onTranscription(text);
      } else {
        alert("No speech detected. Please try again.");
      }
    } catch (error) {
      console.error("Transcription error:", error);
      alert("Transcription failed. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const buttonClassName = [
    "voice-btn",
    isRecording ? "voice-btn--recording" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="voice-control">
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isTranscribing}
        className={buttonClassName}
        title={isRecording ? t("voice.stop") : t("voice.start")}
      >
        {isTranscribing ? (
          <Loader2 size={20} className="animate-spin" />
        ) : isRecording ? (
          <StopCircle size={20} />
        ) : (
          <Mic size={20} />
        )}
      </button>

      {/* Device selector dropdown */}
    </div>
  );
};
