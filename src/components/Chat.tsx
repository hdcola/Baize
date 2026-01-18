import React, { useRef, useEffect, useState } from "react";
import {
  Send,
  Settings as SettingsIcon,
  Loader2,
  Volume2,
  Paperclip,
  Terminal,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useBaizeChat } from "../hooks/use-baize-chat";
import { VoiceControl } from "./VoiceControl";
import { elevenLabsService } from "../lib/elevenlabs";
import { useTranslation } from "react-i18next";

interface ChatProps {
  onOpenSettings: () => void;
}

const PROMPT_KEYS = [
  "chat.prompts.summary",
  "chat.prompts.actionItems",
  "chat.prompts.reply",
  "chat.prompts.studyNotes",
];

export const Chat: React.FC<ChatProps> = ({ onOpenSettings }) => {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    config,
    sendMessage,
  } = useBaizeChat();
  const { t } = useTranslation();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const raf = requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [messages]);

  const handleVoiceTranscription = (text: string) => {
    handleInputChange({ target: { value: text } } as any);
    textInputRef.current?.focus();
  };

  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt);
  };

  const handlePlayMessage = async (text: string, index: number) => {
    if (playingMessageIndex === index) {
      return;
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
    if (selectedFiles && selectedFiles.length > 0) {
      const newFiles = Array.from(selectedFiles);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
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
        <div className="prose">
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
        <div className="message-stack">
          {toolCallParts.map((part: any, idx: number) => (
            <div key={`tool-call-${idx}`} className="tool-call-indicator">
              <details>
                <summary className="tool-call-summary">
                  <Terminal size={14} />
                  <span className="tool-call-name">{part.toolName}</span>
                </summary>
                <pre className="tool-call-payload">
                  {JSON.stringify(part.args ?? part.input, null, 2)}
                </pre>
              </details>
            </div>
          ))}
          {otherParts.map((part: any, idx: number) => {
            if (part.type === "tool-result") {
              return null;
            }

            if (part.type === "image") {
              return (
                <div key={idx}>
                  <img
                    src={part.image}
                    alt="Attached"
                    className="message-image"
                  />
                </div>
              );
            }
            if (part.type === "text") {
              return (
                <div key={`text-${idx}`} className="prose">
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
      <div className="panel">
        <div className="empty-state">
          <span className="pill">{t("common.setup")}</span>
          <h2 className="panel-title">{t("chat.welcome")}</h2>
          <p className="panel-subtitle">{t("chat.configureMsg")}</p>
          <button
            onClick={onOpenSettings}
            className="primary-btn"
            type="button"
          >
            {t("chat.goToSettings")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel chat-panel">
      <header
        className="panel-header"
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div className="panel-title-block">
          <div className="panel-title-row">
            <h1 className="panel-title">MatePI</h1>
            <span className="badge">{t("common.beta")}</span>
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          className="icon-btn"
          type="button"
          aria-label="Open settings"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
          }}
        >
          <SettingsIcon size={18} />
        </button>
      </header>

      <div className="panel-body">
        <div className="messages" ref={messagesContainerRef}>
          {messages.length === 0 && (
            <div className="empty-chat">
              <p className="empty-title">{t("chat.startSession")}</p>
              <p className="empty-subtitle">{t("chat.startSubtitle")}</p>
              <div className="prompt-grid">
                {PROMPT_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    className="prompt-chip"
                    onClick={() => handlePromptClick(t(key))}
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message ${
                msg.role === "user" ? "message--user" : "message--assistant"
              }`}
            >
              <div className="message-bubble">{renderMessageContent(msg)}</div>
              {msg.role === "assistant" && (
                <div className="message-actions">
                  <button
                    onClick={() =>
                      handlePlayMessage(extractTextFromMessage(msg), idx)
                    }
                    disabled={playingMessageIndex === idx}
                    className="message-action"
                    type="button"
                    title="Play audio"
                  >
                    {playingMessageIndex === idx ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        {t("chat.playing")}
                      </>
                    ) : (
                      <>
                        <Volume2 size={14} />
                        {t("chat.play")}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="composer">
          {attachments.length > 0 && (
            <div className="attachments">
              {attachments.map((file, idx) => (
                <div key={idx} className="attachment-card">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    className="attachment-image"
                  />
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="attachment-remove"
                    type="button"
                    aria-label="Remove attachment"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={onFormSubmit} className="composer-form">
            <div className="composer-row">
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
                className="icon-btn"
                disabled={isLoading}
                title="Attach image"
              >
                <Paperclip size={20} />
              </button>
              <input
                ref={textInputRef}
                value={input}
                onChange={handleInputChange}
                placeholder={t("chat.placeholder")}
                className="input-field"
                disabled={isLoading}
              />
              <div className="composer-actions">
                <VoiceControl onTranscription={handleVoiceTranscription} />
                <button
                  type="submit"
                  className="primary-btn send-btn"
                  disabled={
                    isLoading || (!input.trim() && attachments.length === 0)
                  }
                  title="Send message"
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
