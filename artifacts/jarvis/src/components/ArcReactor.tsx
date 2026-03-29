import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ArcReactorProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ArcReactor({ className, size = "md" }: ArcReactorProps) {
  const dimensions = {
    sm: "w-8 h-8",
    md: "w-24 h-24",
    lg: "w-48 h-48"
  };

  return (
    <div className={cn("relative flex items-center justify-center", dimensions[size], className)}>
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ 
          boxShadow: [
            "0 0 10px #00f0ff, inset 0 0 10px #00f0ff", 
            "0 0 30px #00f0ff, inset 0 0 30px #00f0ff", 
            "0 0 10px #00f0ff, inset 0 0 10px #00f0ff"
          ] 
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Outer Ring */}
      <motion.div 
        className="absolute inset-0 rounded-full border-[2px] border-primary/40 border-dashed"
        animate={{ rotate: 360 }} 
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }} 
      />
      
      {/* Inner Ring */}
      <motion.div 
        className={cn("absolute rounded-full border border-primary/60 border-dotted", 
          size === "sm" ? "inset-1" : size === "md" ? "inset-3" : "inset-6 border-[4px]"
        )}
        animate={{ rotate: -360 }} 
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }} 
      />
      
      {/* Core Glow */}
      <div className={cn("absolute rounded-full bg-gradient-to-br from-primary to-[#0055ff] opacity-80 blur-sm",
        size === "sm" ? "inset-2" : size === "md" ? "inset-6" : "inset-12"
      )} />
      
      {/* Bright Center */}
      <div className={cn("absolute rounded-full bg-white opacity-90 blur-[1px]",
        size === "sm" ? "inset-3" : size === "md" ? "inset-8" : "inset-[60px]"
      )} />
    </div>
  );
}
