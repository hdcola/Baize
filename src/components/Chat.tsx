import React, { useRef, useEffect, useState } from "react";
import {
    Send,
    Settings as SettingsIcon,
    Loader2,
    Play,
    Volume2,
} from "lucide-react";
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
    const [playingMessageIndex, setPlayingMessageIndex] = useState<
        number | null
    >(null);

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
                                    }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            fontWeight: "bold",
                                        }}>
                                        <Play size={14} />
                                        Using tool: {part.toolName}
                                    </div>
                                    <details>
                                        <summary
                                            style={{
                                                cursor: "pointer",
                                                outline: "none",
                                                marginTop: "4px",
                                            }}>
                                            View Details
                                        </summary>
                                        <pre
                                            style={{
                                                overflowX: "auto",
                                                fontSize: "0.85em",
                                                marginTop: "4px",
                                            }}>
                                            {JSON.stringify(part.args, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            );
                        }
                        if (part.type === "tool-result") {
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
                }}>
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
                    }}>
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
                }}>
                <h1
                    style={{
                        margin: 0,
                        fontSize: "18px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}>
                    Baize
                    <span
                        style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            background: "#e0e7ff",
                            color: "#3730a3",
                            borderRadius: "10px",
                        }}>
                        Beta
                    </span>
                </h1>
                <button
                    onClick={onOpenSettings}
                    style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-color)",
                    }}>
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
                }}>
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        style={{
                            alignSelf:
                                msg.role === "user" ? "flex-end" : "flex-start",
                            maxWidth: "85%",
                        }}>
                        <div
                            style={{
                                padding: "12px",
                                borderRadius: "12px",
                                backgroundColor:
                                    msg.role === "user"
                                        ? "var(--chat-bg-user)"
                                        : "var(--chat-bg-ai)",
                                color:
                                    msg.role === "user"
                                        ? "white"
                                        : "var(--text-color)",
                                border: "1px solid transparent",
                            }}>
                            {renderMessageContent(msg)}
                        </div>
                        {/* Play button for assistant messages */}
                        {msg.role === "assistant" && (
                            <button
                                onClick={() =>
                                    handlePlayMessage(
                                        extractTextFromMessage(msg),
                                        idx,
                                    )
                                }
                                disabled={playingMessageIndex === idx}
                                style={{
                                    marginTop: "4px",
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-color)",
                                    cursor:
                                        playingMessageIndex === idx
                                            ? "not-allowed"
                                            : "pointer",
                                    opacity:
                                        playingMessageIndex === idx ? 0.6 : 0.7,
                                    padding: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontSize: "12px",
                                }}
                                title="Play audio">
                                {playingMessageIndex === idx ? (
                                    <>
                                        <Loader2
                                            size={14}
                                            className="animate-spin"
                                        />
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
            <form
                onSubmit={handleSubmit}
                style={{
                    padding: "12px",
                    borderTop: "1px solid var(--border-color)",
                    background: "var(--bg-color)",
                }}>
                <div
                    style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                    }}>
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
                        }}
                        disabled={isLoading}
                    />
                    <VoiceControl onTranscription={handleVoiceTranscription} />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
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
                            opacity: isLoading || !input.trim() ? 0.6 : 1,
                            cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
                        }}>
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
