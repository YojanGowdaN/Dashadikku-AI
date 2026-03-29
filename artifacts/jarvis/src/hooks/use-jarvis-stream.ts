import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export interface StreamingMessage {
  role: "assistant";
  content: string;
  intent?: string;
  provider?: string;
  image?: { b64_json: string; mimeType: string };
  createdAt: string;
}

interface UseJarvisStreamOptions {
  onComplete?: (message: StreamingMessage) => void;
}

export function useJarvisStream(conversationId: number, options?: UseJarvisStreamOptions) {
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    setIsStreaming(true);
    setStreamingMessage({
      role: "assistant",
      content: "",
      intent: "analyzing",
      provider: "routing",
      createdAt: new Date().toISOString(),
    });

    let finalMessage: StreamingMessage = {
      role: "assistant",
      content: "",
      intent: "general",
      provider: "gemini",
      createdAt: new Date().toISOString(),
    };

    try {
      const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/api/jarvis/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error("Failed to send message");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.slice(6).trim();
          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);

            if (data.done) {
              break;
            } else if (data.error) {
              finalMessage.content += `\n\nError: ${data.error}`;
              setStreamingMessage((prev) => ({ ...prev!, content: finalMessage.content }));
            } else if (data.intent !== undefined || data.provider !== undefined) {
              finalMessage.intent = data.intent ?? finalMessage.intent;
              finalMessage.provider = data.provider ?? finalMessage.provider;
              setStreamingMessage((prev) => ({
                ...prev!,
                intent: finalMessage.intent,
                provider: finalMessage.provider,
              }));
            } else if (data.image) {
              finalMessage.image = data.image;
              finalMessage.content = "[IMAGE_GENERATED]";
              setStreamingMessage((prev) => ({
                ...prev!,
                image: data.image,
                content: "[IMAGE_GENERATED]",
              }));
            } else if (data.content) {
              finalMessage.content += data.content;
              setStreamingMessage((prev) => ({
                ...prev!,
                content: finalMessage.content,
              }));
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      options?.onComplete?.(finalMessage);
    } catch (error) {
      console.error("Stream error:", error);
      setStreamingMessage((prev) => ({
        ...prev!,
        content: "System error — connection interrupted. Please try again.",
        intent: "error",
      }));
    } finally {
      setIsStreaming(false);
      setStreamingMessage(null);
      queryClient.invalidateQueries({
        queryKey: [`/api/jarvis/conversations/${conversationId}`],
      });
    }
  }, [conversationId, isStreaming, queryClient, options]);

  return { sendMessage, isStreaming, streamingMessage };
}
