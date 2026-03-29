import { ArcReactor } from "./ArcReactor";
import { useCreateJarvisConversation } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Terminal, Code, Image as ImageIcon, Settings } from "lucide-react";
import { motion } from "framer-motion";

export function WelcomeScreen() {
  const [, setLocation] = useLocation();
  const createConv = useCreateJarvisConversation({
    mutation: {
      onSuccess: (data) => setLocation(`/c/${data.id}`)
    }
  });

  const runCommand = (command: string) => {
    // We create a chat, the user can then send the command.
    // Or we just create a chat titled with the command.
    createConv.mutate({ data: { title: command.slice(0, 30) + "..." } });
  };

  const suggestions = [
    { icon: <Terminal size={20}/>, text: "What's the status of all systems?" },
    { icon: <Code size={20}/>, text: "Write a React component for a data grid" },
    { icon: <ImageIcon size={20}/>, text: "Generate an image of a cybernetic eye" },
    { icon: <Settings size={20}/>, text: "Optimize the sorting algorithm" },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative bg-background overflow-hidden min-h-screen">
      
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{
        backgroundImage: `url(${import.meta.env.BASE_URL}images/hologram-grid.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        mixBlendMode: 'screen'
      }} />

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="z-10 flex flex-col items-center"
      >
        <ArcReactor size="lg" className="mb-12" />
        
        <h1 className="text-6xl md:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-primary/80 to-primary/20 tracking-[0.2em] hud-glow-text mb-4">
          dashadikku
        </h1>
        
        <p className="text-primary/60 font-mono tracking-[0.3em] uppercase text-sm md:text-base mb-16 max-w-md text-center">
          Your Personal AI Assistant
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-6">
          {suggestions.map((s, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + (i * 0.1) }}
              onClick={() => runCommand(s.text)}
              disabled={createConv.isPending}
              className="flex items-center gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/15 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-all duration-300 text-left group"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {s.icon}
              </div>
              <span className="text-sm font-mono text-primary/80 group-hover:text-primary transition-colors">
                {s.text}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
