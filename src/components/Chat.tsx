import React, { useRef, useEffect, useState } from "react";
import {
  Send,
  Settings as SettingsIcon,
  Loader2,
  Play,
  Volume2,
  Paperclip,
  Terminal,
  X,
  Image as ImageIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useBaizeChat } from "../hooks/use-baize-chat";
import { VoiceControl } from "./VoiceControl";
import { elevenLabsService } from "../lib/elevenlabs";

interface ChatProps {
  onOpenSettings: () => void;
}

export const Chat: React.FC<ChatProps> = ({ onOpenSettings }) => {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    config,
  } = useBaizeChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleVoiceTranscription = (text: string) => {
    // Set the transcribed text to input
    handleInputChange({ target: { value: text } } as any);
  };

  const handlePlayMessage = async (text: string, index: number) => {
    if (playingMessageIndex === index) {
      return; // Already playing
    }

    try {
      setPlayingMessageIndex(index);
      const audioBlob = await elevenLabsService.textToSpeech({ text });
      await elevenLabsService.playAudio(audioBlob);
    } catch (error) {
      console.error("TTS error:", error);
      alert("Failed to play audio");
    } finally {
      setPlayingMessageIndex(null);
    }
  };

  const extractTextFromMessage = (msg: any): string => {
    if (typeof msg.content === "string") {
      return msg.content;
    }
    if (Array.isArray(msg.content)) {
      return msg.content
        .filter((part: any) => part.type === "text")
        .map((part: any) => part.text)
        .join(" ");
    }
    return "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    console.log("[Chat] File input change:", selectedFiles);
    if (selectedFiles && selectedFiles.length > 0) {
      const newFiles = Array.from(selectedFiles);
      console.log("[Chat] processed files:", newFiles);
      setAttachments((prev) => {
        const updated = [...prev, ...newFiles];
        console.log("[Chat] updated attachments:", updated);
        return updated;
      });
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(e, attachments);
    setAttachments([]);
  };

  const renderMessageContent = (msg: any) => {
    if (typeof msg.content === "string") {
      return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
      );
    }
    if (Array.isArray(msg.content)) {
      const toolCallParts = msg.content.filter(
        (part: any) => part.type === "tool-call",
      );
      const otherParts = msg.content.filter(
        (part: any) => part.type !== "tool-call",
      );
      return (
        <div>
          {toolCallParts.map((part: any, idx: number) => {
            return (
              <div
                key={`tool-call-${idx}`}
                className="tool-call-indicator"
                style={{
                  marginTop: "12px",
                  marginBottom: "12px",
                  borderRadius: "8px",
                  fontSize: "0.9em",
                  border: "1px solid var(--border-color)",
                  overflow: "hidden",
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                }}
              >
                <details>
                  <summary
                    style={{
                      cursor: "pointer",
                      outline: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontWeight: "500",
                      padding: "8px 12px",
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      listStyle: "none",
                    }}
                  >
                    <Terminal size={14} style={{ opacity: 0.7 }} />
                    <span
                      style={{
                        fontFamily: "monospace",
                        opacity: 0.9,
                        flex: 1,
                      }}
                    >
                      {part.toolName}
                    </span>
                  </summary>
                  <pre
                    style={{
                      overflowX: "auto",
                      fontSize: "0.85em",
                      padding: "12px",
                      margin: 0,
                      color: "rgba(255, 255, 255, 0.8)",
                      borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                      fontFamily: "monospace",
                    }}
                  >
                    {JSON.stringify(part.args ?? part.input, null, 2)}
                  </pre>
                </details>
              </div>
            );
          })}
          {otherParts.map((part: any, idx: number) => {
            if (part.type === "tool-result") {
              return null;
            }

            if (part.type === "image") {
              return (
                <div
                  key={idx}
                  style={{ marginTop: "8px", marginBottom: "8px" }}
                >
                  <img
                    src={part.image}
                    alt="Attached image"
                    style={{
                      maxWidth: "100%",
                      borderRadius: "8px",
                      maxHeight: "300px",
                    }}
                  />
                </div>
              );
            }
            if (part.type === "text") {
              return (
                <div
                  key={`text-${idx}`}
                  className="prose prose-sm max-w-none dark:prose-invert"
                >
                  <ReactMarkdown>{part.text}</ReactMarkdown>
                </div>
              );
            }
            return null;
          })}
        </div>
      );
    }
    return null;
  };

  if (!config?.apiKey) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <h2>Welcome to Baize</h2>
        <p>Please configure your AI provider to get started.</p>
        <button
          onClick={onOpenSettings}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "var(--primary-color)",
            color: "white",
            borderRadius: "6px",
            border: "none",
            fontWeight: "bold",
          }}
        >
          Go to Settings
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div
        style={{
          padding: "12px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-color)",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          Baize
          <span
            style={{
              fontSize: "10px",
              padding: "2px 6px",
              background: "#e0e7ff",
              color: "#3730a3",
              borderRadius: "10px",
            }}
          >
            Beta
          </span>
        </h1>
        <button
          onClick={onOpenSettings}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-color)",
          }}
        >
          <SettingsIcon size={20} />
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
            }}
          >
            <div
              style={{
                padding: "12px",
                borderRadius: "12px",
                backgroundColor:
                  msg.role === "user"
                    ? "var(--chat-bg-user)"
                    : "var(--chat-bg-ai)",
                color: msg.role === "user" ? "white" : "var(--text-color)",
                border: "1px solid transparent",
              }}
            >
              {renderMessageContent(msg)}
            </div>
            {/* Play button for assistant messages */}
            {msg.role === "assistant" && (
              <button
                onClick={() =>
                  handlePlayMessage(extractTextFromMessage(msg), idx)
                }
                disabled={playingMessageIndex === idx}
                style={{
                  marginTop: "4px",
                  background: "none",
                  border: "none",
                  color: "var(--text-color)",
                  cursor:
                    playingMessageIndex === idx ? "not-allowed" : "pointer",
                  opacity: playingMessageIndex === idx ? 0.6 : 0.7,
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                }}
                title="Play audio"
              >
                {playingMessageIndex === idx ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Volume2 size={14} />
                    Play
                  </>
                )}
              </button>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          borderTop: "1px solid var(--border-color)",
          background: "var(--bg-color)",
          padding: "12px",
        }}
      >
        {/* Thumbnails Preview */}
        {attachments.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              marginBottom: "8px",
              paddingBottom: "4px",
            }}
          >
            {attachments.map((file, idx) => (
              <div key={idx} style={{ position: "relative", flexShrink: 0 }}>
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  style={{
                    width: "60px",
                    height: "60px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                  }}
                />
                <button
                  onClick={() => removeAttachment(idx)}
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    background: "gray",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "10px",
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={onFormSubmit}
          style={{
            padding: 0,
            margin: 0,
          }}
        >
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <input
              type="file"
              multiple
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: "none",
                border: "none",
                padding: "8px",
                color: "var(--text-color)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              disabled={isLoading}
              title="Attach Image"
            >
              <Paperclip size={20} />
            </button>
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask Baize to do something..."
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--input-bg)",
                color: "inherit",
                outline: "none",
                minHeight: "44px",
              }}
              disabled={isLoading}
            />
            <VoiceControl onTranscription={handleVoiceTranscription} />
            <button
              type="submit"
              disabled={
                isLoading || (!input.trim() && attachments.length === 0)
              }
              style={{
                background: "var(--primary-color)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "8px",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity:
                  isLoading || (!input.trim() && attachments.length === 0)
                    ? 0.6
                    : 1,
                cursor:
                  isLoading || (!input.trim() && attachments.length === 0)
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
