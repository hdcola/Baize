import React, { useRef, useEffect, useState } from "react";
import {
  Send,
  Settings as SettingsIcon,
  Loader2,
  Play,
  Paperclip,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useBaizeChat } from "../hooks/use-baize-chat";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      return <div>{msg.content}</div>;
    }
    if (Array.isArray(msg.content)) {
      return (
        <div>
          {msg.content.map((part: any, idx: number) => {
            if (part.type === "text") {
              return <div key={idx}>{part.text}</div>;
            }
            if (part.type === "image") {
                return (
                    <div key={idx} style={{ marginTop: '8px', marginBottom: '8px' }}>
                        <img 
                            src={part.image} 
                            alt="Attached image" 
                            style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '300px' }} 
                        />
                    </div>
                )
            }
            if (part.type === "tool-call") {
              return (
                <div
                  key={idx}
                  className="tool-call-indicator"
                  style={{
                    marginTop: "8px",
                    padding: "8px",
                    background: "rgba(0,0,0,0.05)",
                    borderRadius: "4px",
                    fontSize: "0.9em",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontWeight: "bold",
                    }}
                  >
                    <Play size={14} />
                    Using tool: {part.toolName}
                  </div>
                  <details>
                    <summary
                      style={{
                        cursor: "pointer",
                        outline: "none",
                        marginTop: "4px",
                      }}
                    >
                      View Details
                    </summary>
                    <pre
                      style={{
                        overflowX: "auto",
                        fontSize: "0.85em",
                        marginTop: "4px",
                      }}
                    >
                      {JSON.stringify(part.args, null, 2)}
                    </pre>
                  </details>
                </div>
              );
            }
            if (part.type === "tool-result") {
              // Not standard CoreMessage content part type for 'assistant' but 'tool' role messages have content array of tool-result?
              // Actually 'assistant' message only has text and tool-call.
              // 'tool' message has tool-result.
              // We display tool results if they are in the message history as separate 'tool' role messages.
              return null;
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
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
          style={{
            borderTop: "1px solid var(--border-color)",
            background: "var(--bg-color)",
            padding: "12px",
          }}
      >
        {/* Thumbnails Preview */}
        {attachments.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '8px', paddingBottom: '4px' }}>
                {attachments.map((file, idx) => (
                    <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                        <img
                            src={URL.createObjectURL(file)}
                            alt="preview"
                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' }}
                        />
                        <button
                            onClick={() => removeAttachment(idx)}
                            style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                background: 'gray',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '10px'
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
            margin: 0
            }}
        >
            <div style={{ display: "flex", gap: "8px", alignItems: 'flex-end' }}>
            <input
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px',
                    color: 'var(--text-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
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
                minHeight: "44px"
                }}
                disabled={isLoading}
            />
            <button
                type="submit"
                disabled={isLoading || (!input.trim() && attachments.length === 0)}
                style={{
                background: "var(--primary-color)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "0 12px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: isLoading || (!input.trim() && attachments.length === 0) ? 0.6 : 1,
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
