import { useState } from "react";
import { ChevronDown, ChevronUp, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuickCommandsProps {
  onCommand: (cmd: string) => void;
}

const COMMANDS = [
  {
    category: "GENERAL",
    color: "text-blue-400",
    items: [
      "What's the weather like today?",
      "What time is it in Tokyo?",
      "Give me a quick summary of quantum computing.",
    ],
  },
  {
    category: "CODE",
    color: "text-purple-400",
    items: [
      "Write a Python function to validate an email address",
      "Explain what a REST API is in simple terms",
      "Write a SQL query to find duplicate rows",
    ],
  },
  {
    category: "IMAGE",
    color: "text-green-400",
    items: [
      "Generate an image of a futuristic city at night",
      "Generate an image of an arc reactor glowing blue",
      "Generate an image of a cyberpunk street market",
    ],
  },
  {
    category: "DEVICE",
    color: "text-orange-400",
    items: [
      "Open Chrome browser",
      "Take a screenshot of my screen",
      "Turn up the volume",
    ],
  },
];

export function QuickCommands({ onCommand }: QuickCommandsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t border-primary/20">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-primary/70" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-primary/70">
            Quick Commands
          </span>
        </div>
        {isOpen ? (
          <ChevronUp size={14} className="text-primary/50" />
        ) : (
          <ChevronDown size={14} className="text-primary/50" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 max-h-72 overflow-y-auto">
              {COMMANDS.map((group) => (
                <div key={group.category}>
                  <div className={cn("text-[9px] font-bold uppercase tracking-widest mb-1.5 px-1", group.color)}>
                    {group.category}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((cmd) => (
                      <button
                        key={cmd}
                        onClick={() => onCommand(cmd)}
                        className="w-full text-left text-[11px] font-mono text-primary/60 hover:text-primary px-2 py-1.5 rounded border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all truncate"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
