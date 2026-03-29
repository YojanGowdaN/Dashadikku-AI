import { useEffect, useRef, useState, useCallback } from "react";
import { useGetJarvisConversation } from "@workspace/api-client-react";
import { ChatMessage } from "./ChatMessage";
import { useJarvisStream, type StreamingMessage } from "@/hooks/use-jarvis-stream";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { useVoiceOutput } from "@/hooks/use-voice-output";
import { Send, Mic, MicOff, Volume2, VolumeX, TerminalSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatAreaProps {
  conversationId: number;
  pendingCommand?: string | null;
  onCommandConsumed?: () => void;
}

export function ChatArea({ conversationId, pendingCommand, onCommandConsumed }: ChatAreaProps) {
  const { data: conversation, isLoading } = useGetJarvisConversation(conversationId);
  const [input, setInput] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { speak, stop: stopSpeaking, isSpeaking, isSupported: ttsSupported } = useVoiceOutput();

  const handleStreamComplete = useCallback((msg: StreamingMessage) => {
    if (voiceEnabled && msg.content && msg.content !== "[IMAGE_GENERATED]") {
      speak(msg.content);
    }
  }, [voiceEnabled, speak]);

  const { sendMessage, isStreaming, streamingMessage } = useJarvisStream(conversationId, {
    onComplete: handleStreamComplete,
  });

  // Consume external pending commands from quick-commands panel
  useEffect(() => {
    if (pendingCommand && !isStreaming) {
      sendMessage(pendingCommand);
      onCommandConsumed?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCommand]);

  const handleVoiceResult = useCallback((transcript: string) => {
    setInput(transcript);
    setTimeout(() => {
      sendMessage(transcript);
      setInput("");
    }, 200);
  }, [sendMessage]);

  const { isListening, isSupported: sttSupported, toggle: toggleMic } = useVoiceInput({
    onResult: handleVoiceResult,
  });

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages, streamingMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background/50">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="mt-4 text-primary font-mono tracking-widest uppercase text-sm animate-pulse">
          Accessing Data Cores...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen relative bg-background overflow-hidden">
      {/* Background decoration */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/hologram-grid.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          mixBlendMode: "screen",
        }}
      />

      {/* Header */}
      <div className="h-16 shrink-0 border-b border-primary/20 bg-background/80 backdrop-blur-md flex items-center px-6 z-10 gap-3">
        <h2 className="text-lg font-display font-bold text-primary/90 tracking-wider truncate flex-1">
          {conversation?.title || "PROTOCOL EXECUTION"}
        </h2>
        <span className="text-xs font-mono text-primary/50 uppercase hidden sm:block">
          <TerminalSquare size={12} className="inline mr-1" />
          ID:{conversationId.toString().padStart(4, "0")}
        </span>

        {/* Voice Output Toggle */}
        {ttsSupported && (
          <button
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setVoiceEnabled((v) => !v);
            }}
            title={voiceEnabled ? "Voice output ON — click to disable" : "Voice output OFF — click to enable"}
            className={cn(
              "p-2 rounded-lg border transition-all text-xs font-mono uppercase",
              voiceEnabled
                ? "border-primary/60 bg-primary/20 text-primary"
                : "border-primary/20 bg-transparent text-primary/40 hover:text-primary/70"
            )}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 z-10">
        <div className="max-w-4xl mx-auto flex flex-col">
          {conversation?.messages.length === 0 && !streamingMessage && (
            <div className="text-center py-20 text-primary/40 font-mono text-sm uppercase tracking-widest">
              Awaiting Input Commands...
            </div>
          )}

          <AnimatePresence initial={false}>
            {conversation?.messages.map((msg, i) => (
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChatMessage message={msg} />
              </motion.div>
            ))}

            {streamingMessage && (
              <motion.div key="streaming" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <ChatMessage message={streamingMessage} isStreaming />
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={endOfMessagesRef} className="h-4" />
        </div>
      </div>

      {/* Voice listening indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 bg-primary/10 border border-primary/50 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-3"
          >
            <span className="w-3 h-3 rounded-full bg-primary animate-ping" />
            <span className="text-primary font-mono text-sm uppercase tracking-widest">
              Listening...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="shrink-0 p-4 md:p-6 bg-gradient-to-t from-background via-background/90 to-transparent z-10">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-end gap-2">
          {/* Voice Input Button */}
          {sttSupported && (
            <button
              type="button"
              onClick={toggleMic}
              disabled={isStreaming}
              title={isListening ? "Stop listening" : "Start voice input"}
              className={cn(
                "shrink-0 p-4 rounded-xl border transition-all duration-300",
                isListening
                  ? "border-primary bg-primary/20 text-primary shadow-[0_0_20px_rgba(0,240,255,0.4)] animate-pulse"
                  : "border-primary/30 bg-secondary/50 text-primary/50 hover:text-primary hover:border-primary/60"
              )}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={isListening ? "Listening to voice..." : "ENTER COMMAND DIRECTIVE..."}
            className="flex-1 bg-secondary/50 border border-primary/30 rounded-xl px-4 py-4 pr-14 text-foreground placeholder:text-primary/30 placeholder:font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 resize-none min-h-[60px] max-h-[200px] backdrop-blur-md transition-all font-mono text-sm"
            rows={1}
            disabled={isStreaming || isListening}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 bottom-2 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 transition-colors"
          >
            <Send size={20} className={isStreaming ? "animate-pulse" : ""} />
          </button>
        </form>
        <div className="max-w-4xl mx-auto text-center mt-2">
          <span className="text-[10px] text-primary/40 font-mono tracking-widest uppercase">
            {sttSupported ? "Voice & Text Input · " : ""}
            {ttsSupported && voiceEnabled ? "Voice Output ON · " : ""}
            Secure Connection
          </span>
        </div>
      </div>
    </div>
  );
}
