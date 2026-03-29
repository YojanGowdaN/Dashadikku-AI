import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { useParams, useLocation } from "wouter";
import { Menu } from "lucide-react";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateJarvisConversation } from "@workspace/api-client-react";

export default function Dashboard() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const id = params.id ? parseInt(params.id, 10) : null;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);

  const createConv = useCreateJarvisConversation({
    mutation: {
      onSuccess: (data) => setLocation(`/c/${data.id}`),
    },
  });

  const handleQuickCommand = useCallback((cmd: string) => {
    setMobileMenuOpen(false);
    if (!id) {
      // Create a new conversation first, then set the pending command
      createConv.mutate(
        { data: { title: cmd.slice(0, 40) } },
        {
          onSuccess: () => {
            // pendingCommand will be sent once we navigate to the new conv
            setTimeout(() => setPendingCommand(cmd), 100);
          },
        }
      );
    } else {
      setPendingCommand(cmd);
    }
  }, [id, createConv]);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30">
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0 z-20">
        <Sidebar onQuickCommand={handleQuickCommand} />
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden absolute top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg bg-background/80 border border-primary/30 text-primary backdrop-blur-md"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 md:hidden shadow-2xl"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <Sidebar onQuickCommand={handleQuickCommand} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        {id ? (
          <ChatArea
            key={id}
            conversationId={id}
            pendingCommand={pendingCommand}
            onCommandConsumed={() => setPendingCommand(null)}
          />
        ) : (
          <WelcomeScreen />
        )}
      </main>
    </div>
  );
}
