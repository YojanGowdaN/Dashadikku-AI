import { useState, useCallback, useRef } from "react";

export function useVoiceOutput() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(() => "speechSynthesis" in window);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text.trim()) return;

    window.speechSynthesis.cancel();

    const cleaned = text
      .replace(/\[IMAGE:[^\]]+\]/g, "Image generated.")
      .replace(/```[\s\S]*?```/g, "Code block.")
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`[^`]+`/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.rate = 0.95;
    utterance.pitch = 0.85;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.name.includes("Daniel") ||
        v.name.includes("David") ||
        v.name.includes("Google UK English Male") ||
        (v.lang === "en-GB" && v.name.toLowerCase().includes("male"))
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, isSupported };
}
