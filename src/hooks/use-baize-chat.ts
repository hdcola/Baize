import { useState, useCallback, useEffect } from "react";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { tools } from "../lib/tools";

export function useBaizeChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<{
    apiKey: string;
    baseUrl: string;
    model: string;
    language: string;
  } | null>(null);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(
        ["apiKey", "baseUrl", "model", "language"],
        (result) => {
          setConfig({
            apiKey: (result.apiKey as string) || "",
            baseUrl: (result.baseUrl as string) || "",
            model: (result.model as string) || "gemini-2.0-flash-exp",
            language: (result.language as string) || "en",
          });
        },
      );
    }
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent, attachments?: File[]) => {
      e?.preventDefault();
      if ((!input.trim() && (!attachments || attachments.length === 0)) || !config) return;

      setIsLoading(true);

      const contentParts: any[] = [];
      if (input.trim()) {
        contentParts.push({ type: "text", text: input });
      }

      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Remove data URL prefix (e.g., "data:image/png;base64,") if the API expects just base64,
                // BUT the AI SDK usually expects the full data URL or handles it.
                // Checking AI SDK docs or common usage: usually `image` part takes a URL or base64.
                // For `experimental_attachments` or standard `content` array with `image` type:
                // Vercel AI SDK `CoreMessage` `UserContent` `ImagePart` expects `image` which is Uint8Array | ArrayBuffer | string (url/base64).
                resolve(result);
            };
            reader.readAsDataURL(file);
          });
           contentParts.push({ type: "image", image: base64 });
        }
      }

      const userMessage = { role: "user", content: contentParts };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      try {
        let provider;
        if (config.model.includes("gpt")) {
          provider = createOpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseUrl || undefined,
          });
        } else {
          provider = createGoogleGenerativeAI({
            apiKey: config.apiKey,
            baseURL: config.baseUrl || undefined,
          });
        }

        const systemPrompt =
          config.language === "zh"
            ? "你是白泽 (Baize)，一个强大的浏览器AI助手。你可以读取网页内容，点击按钮，输入文字。请根据用户需求使用工具。"
            : "You are Baize, a powerful browser AI assistant. You can read page content, click buttons, and input text. Use tools as needed to fulfill user requests.";

        const result = await streamText({
          model: provider(config.model),
          system: systemPrompt,
          messages: [...messages, userMessage] as any,
          tools: tools,
          maxSteps: 5,
        } as any);

        let accumulatedText = "";
        let toolCalls: Record<string, any> = {};

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        for await (const part of result.fullStream) {
          if (part.type === "text-delta") {
            accumulatedText +=
              (part as any).text || (part as any).textDelta || "";
          } else if (part.type === "tool-call") {
            const toolCallPart = part;
            toolCalls[toolCallPart.toolCallId] = toolCallPart;
          }

          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            // Ensure we are updating the last assistant message we added
            if (lastMsg.role === "assistant") {
              if (Object.keys(toolCalls).length > 0) {
                const contentParts: any[] = [];
                if (accumulatedText)
                  contentParts.push({ type: "text", text: accumulatedText });
                Object.values(toolCalls).forEach((tc) => {
                  contentParts.push({ type: "tool-call", ...tc.toolCall });
                });
                newMessages[newMessages.length - 1] = {
                  ...lastMsg,
                  content: contentParts,
                };
              } else {
                newMessages[newMessages.length - 1] = {
                  ...lastMsg,
                  content: accumulatedText,
                };
              }
            }
            return newMessages;
          });
        }
      } catch (error) {
        console.error(error);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Error: " + (error as Error).message },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, config, messages],
  );

  return {
    messages,
    input,
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setInput(e.target.value),
    handleSubmit,
    isLoading,
    config,
  };
}
