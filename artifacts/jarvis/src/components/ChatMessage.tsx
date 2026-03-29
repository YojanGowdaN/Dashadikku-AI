import { JarvisMessage } from "@workspace/api-client-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Cpu, User, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { type StreamingMessage } from "@/hooks/use-jarvis-stream";

type MessageLike = Partial<JarvisMessage> | StreamingMessage;

interface ChatMessageProps {
  message: MessageLike;
  isStreaming?: boolean;
}

function parseImageContent(content: string): { b64_json: string; mimeType: string } | null {
  const match = content.match(/^\[IMAGE:([^:]+):(.+)\]$/s);
  if (match) return { mimeType: match[1], b64_json: match[2] };
  return null;
}

const INTENT_STYLES: Record<string, string> = {
  code: "border-purple-500/50 text-purple-400 bg-purple-500/10",
  image: "border-green-500/50 text-green-400 bg-green-500/10",
  device: "border-orange-500/50 text-orange-400 bg-orange-500/10",
  memory: "border-yellow-500/50 text-yellow-400 bg-yellow-500/10",
  analyzing: "border-primary/50 text-primary bg-primary/10 animate-pulse",
  error: "border-destructive/50 text-destructive bg-destructive/10",
  general: "border-blue-500/50 text-blue-400 bg-blue-500/10",
  routing: "border-primary/30 text-primary/60 bg-primary/5 animate-pulse",
};

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isJarvis = message.role === "assistant";
  const intent = message.intent?.toLowerCase() ?? "general";
  const intentStyle = INTENT_STYLES[intent] ?? INTENT_STYLES.general;

  // Detect image content — stored as [IMAGE:mimeType:b64data] in DB
  // or as a streaming image object on the streaming message
  const streamImg = (message as StreamingMessage).image;
  let imageData: { b64_json: string; mimeType: string } | null = streamImg ?? null;

  if (!imageData && message.content === "[IMAGE_GENERATED]") {
    imageData = null; // Will be resolved from DB on next load
  }

  if (!imageData && message.content && message.content.startsWith("[IMAGE:")) {
    imageData = parseImageContent(message.content);
  }

  const imgSrc = imageData
    ? `data:${imageData.mimeType};base64,${imageData.b64_json}`
    : null;

  const displayContent = imageData
    ? null
    : message.content === "[IMAGE_GENERATED]"
    ? "Image generated successfully."
    : message.content;

  return (
    <div
      className={cn(
        "flex gap-3 w-full py-4 group",
        isJarvis ? "pr-4 sm:pr-16" : "pl-4 sm:pl-16 flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "shrink-0 w-9 h-9 rounded-full flex items-center justify-center border mt-1",
          isJarvis
            ? "bg-primary/10 border-primary/40 text-primary"
            : "bg-secondary border-muted-foreground/30 text-muted-foreground"
        )}
      >
        {isJarvis ? (
          <Cpu size={18} className={intent === "analyzing" || intent === "routing" ? "animate-spin" : ""} />
        ) : (
          <User size={18} />
        )}
      </div>

      {/* Content bubble */}
      <div className={cn("flex flex-col gap-1.5 max-w-[86%]", !isJarvis && "items-end")}>
        {/* Header row */}
        {isJarvis ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-bold text-primary text-xs tracking-widest">dashadikku</span>
            {message.intent && (
              <span
                className={cn(
                  "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border",
                  intentStyle
                )}
              >
                {message.intent}
              </span>
            )}
            {message.provider && message.provider !== "routing" && (
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded border border-primary/20 text-primary/50 bg-primary/5">
                via {message.provider}
              </span>
            )}
            {isStreaming && (
              <span className="text-[10px] text-primary/40 font-mono animate-pulse">
                ● streaming
              </span>
            )}
          </div>
        ) : (
          <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
            YOU
          </span>
        )}

        {/* Message body */}
        <div
          className={cn(
            "relative px-5 py-4 text-[14px] leading-relaxed shadow-lg rounded-2xl",
            isJarvis
              ? "bg-secondary/40 border border-primary/20 rounded-tl-sm text-foreground backdrop-blur-sm"
              : "bg-muted/30 border border-border/50 rounded-tr-sm text-muted-foreground"
          )}
        >
          {isJarvis && (
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-[inherit] pointer-events-none" />
          )}

          {imgSrc ? (
            <div className="flex flex-col gap-3">
              <div className="relative overflow-hidden rounded-lg border border-primary/30">
                <img
                  src={imgSrc}
                  alt="Generated by dashadikku"
                  className="max-w-full h-auto max-h-[480px] object-contain block"
                />
              </div>
              <a
                href={imgSrc}
                download="jarvis-image.png"
                className="inline-flex items-center gap-2 text-xs text-primary/70 hover:text-primary font-mono uppercase tracking-wider transition-colors w-fit"
              >
                <Download size={12} />
                Download Image
              </a>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm prose-p:leading-relaxed prose-pre:bg-black/60 prose-pre:border prose-pre:border-primary/20 max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {displayContent || ""}
              </ReactMarkdown>
            </div>
          )}

          {/* Streaming cursor */}
          {isStreaming && !imgSrc && (
            <span className="inline-block w-2 h-4 bg-primary/80 animate-pulse ml-1 align-middle" />
          )}
        </div>
      </div>
    </div>
  );
}
