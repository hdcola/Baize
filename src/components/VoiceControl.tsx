import React, { useState, useRef, useEffect } from "react";
import { Mic, Loader2, StopCircle } from "lucide-react";
import { elevenLabsService } from "../lib/elevenlabs";

interface VoiceControlProps {
    onTranscription: (text: string) => void;
}

export const VoiceControl: React.FC<VoiceControlProps> = ({
    onTranscription,
}) => {
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

            const stream =
                await navigator.mediaDevices.getUserMedia(constraints);

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

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Recording button */}
            <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing}
                style={{
                    background: isRecording
                        ? "#ef4444"
                        : "var(--primary-color)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isTranscribing ? "not-allowed" : "pointer",
                    opacity: isTranscribing ? 0.6 : 1,
                }}
                title={isRecording ? "Stop recording" : "Start recording"}>
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
