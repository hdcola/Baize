import React, {
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
} from "react";
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

const MAX_TEXTAREA_LINES = 5; // Matches max-height in CSS
const LINE_HEIGHT_MULTIPLIER = 1.4; // Matches --line-height-input in CSS

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
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const measureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isMultiline, setIsMultiline] = useState(false);
  const [isOverLimit, setIsOverLimit] = useState(false);

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

  const setInputValue = (value: string) => {
    handleInputChange({ target: { value } } as any);
  };

  const focusComposerInput = useCallback(() => {
    const setCaretToEnd = (el: HTMLInputElement | HTMLTextAreaElement) => {
      const len = el.value.length;
      el.setSelectionRange(len, len);
    };
    if (isMultiline) {
      const el = textAreaRef.current;
      if (el) {
        el.focus();
        requestAnimationFrame(() => setCaretToEnd(el));
      }
    } else {
      const el = textInputRef.current;
      if (el) {
        el.focus();
        requestAnimationFrame(() => setCaretToEnd(el));
      }
    }
  }, [isMultiline]);

  const handleVoiceTranscription = (text: string) => {
    setInputValue(text);
    focusComposerInput();
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

  const submitIfReady = (e: React.SyntheticEvent) => {
    if (!isLoading && (input.trim() || attachments.length > 0)) {
      handleSubmit(e as unknown as React.FormEvent, attachments);
      setAttachments([]);
    }
  };

  const handleSingleLineKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        e.preventDefault();
        setInputValue(`${input}\n`);
        return;
      }
      e.preventDefault();
      submitIfReady(e);
    }
  };

  const handleMultiLineKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitIfReady(e);
    }
  };

  const getTextMetricsTarget = () =>
    textInputRef.current ?? textAreaRef.current;

  const shouldWrapToNextLine = (value: string) => {
    const el = getTextMetricsTarget();
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (!measureCanvasRef.current) {
      measureCanvasRef.current = document.createElement("canvas");
    }
    const ctx = measureCanvasRef.current.getContext("2d");
    if (!ctx) return false;
    ctx.font = `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${style.fontSize}/${style.lineHeight} ${style.fontFamily}`;
    const textWidth = ctx.measureText(value).width;
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const availableWidth = el.clientWidth - paddingLeft - paddingRight;
    return textWidth > availableWidth;
  };

  useEffect(() => {
    if (!isMultiline) {
      setIsOverLimit(false);
      return;
    }
    const el = textAreaRef.current;
    if (!el) return;
    const style = window.getComputedStyle(el);
    const fontSize = parseFloat(style.fontSize) || 14;
    const lineHeight =
      parseFloat(style.lineHeight) ||
      Math.round(fontSize * LINE_HEIGHT_MULTIPLIER);
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;
    const maxHeight =
      lineHeight * MAX_TEXTAREA_LINES + paddingTop + paddingBottom;
    el.style.height = "auto";
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
    setIsOverLimit(el.scrollHeight > maxHeight + 1);
  }, [input, isMultiline]);

  useLayoutEffect(() => {
    const hasNewline = input.includes("\n");
    if (hasNewline) {
      if (!isMultiline) setIsMultiline(true);
      return;
    }
    const wrapNeeded = shouldWrapToNextLine(input);
    if (wrapNeeded !== isMultiline) {
      setIsMultiline(wrapNeeded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  useEffect(() => {
    focusComposerInput();
  }, [focusComposerInput]);

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
      const hasRenderableContent =
        toolCallParts.length > 0 ||
        otherParts.some(
          (part: any) => part.type === "text" || part.type === "image",
        );

      if (!hasRenderableContent) return null;
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
            <div
              className={`composer-row${
                isMultiline ? " composer-row--multiline" : ""
              }`}
            >
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
                className="attach-btn"
                disabled={isLoading}
                title="Attach image"
              >
                <Paperclip size={20} />
              </button>
              <div className="input-wrapper">
                {isMultiline ? (
                  <textarea
                    ref={textAreaRef}
                    value={input}
                    onChange={(e) =>
                      handleInputChange(
                        e as unknown as React.ChangeEvent<HTMLInputElement>,
                      )
                    }
                    onKeyDown={handleMultiLineKeyDown}
                    placeholder={t("chat.placeholder")}
                    className={`input-field input-field--multiline${
                      isOverLimit ? " input-field--scroll" : ""
                    }`}
                    disabled={isLoading}
                    rows={1}
                  />
                ) : (
                  <input
                    ref={textInputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleSingleLineKeyDown}
                    placeholder={t("chat.placeholder")}
                    className="input-field"
                    disabled={isLoading}
                  />
                )}
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
              <div className="composer-actions">
                <VoiceControl onTranscription={handleVoiceTranscription} />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
