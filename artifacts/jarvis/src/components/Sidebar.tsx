import { useListJarvisConversations, useCreateJarvisConversation, useDeleteJarvisConversation } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Plus, MessageSquare, Trash2, Cpu } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ArcReactor } from "./ArcReactor";
import { TasksPanel } from "./TasksPanel";
import { QuickCommands } from "./QuickCommands";

interface SidebarProps {
  onQuickCommand?: (cmd: string) => void;
}

export function Sidebar({ onQuickCommand }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { data: conversations, isLoading } = useListJarvisConversations();

  const createConv = useCreateJarvisConversation({
    mutation: {
      onSuccess: (data) => setLocation(`/c/${data.id}`),
    },
  });

  const deleteConv = useDeleteJarvisConversation({
    mutation: {
      onSuccess: () => {
        window.location.href = import.meta.env.BASE_URL;
      },
    },
  });

  const handleNewChat = () => {
    createConv.mutate({ data: { title: "New Initialization" } });
  };

  const isActive = (id: number) => location === `/c/${id}`;

  return (
    <div className="w-80 h-screen flex flex-col bg-secondary/30 border-r border-primary/20 backdrop-blur-xl">
      {/* Logo Header */}
      <div className="p-6 border-b border-primary/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <ArcReactor size="sm" />
          <div>
            <h1 className="text-xl font-display font-bold text-primary tracking-widest hud-glow-text leading-none">
              dashadikku
            </h1>
            <p className="text-[10px] text-primary/70 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              System Online
            </p>
          </div>
        </div>
      </div>

      {/* New Protocol Button */}
      <div className="p-4 shrink-0">
        <button
          onClick={handleNewChat}
          disabled={createConv.isPending}
          className="w-full relative group overflow-hidden px-4 py-3 rounded-lg border border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all duration-300 flex items-center justify-center gap-2 text-primary uppercase font-bold tracking-wider text-sm"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <Plus size={16} />
          {createConv.isPending ? "Initializing..." : "New Protocol"}
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden px-3 pb-4 space-y-2">
        <div className="text-[10px] uppercase tracking-widest text-primary/50 px-2 pb-1 font-bold">
          Communications Log
        </div>

        {isLoading ? (
          <div className="p-4 flex justify-center">
            <Cpu className="w-5 h-5 text-primary/50 animate-pulse" />
          </div>
        ) : conversations?.length === 0 ? (
          <div className="text-center p-4 text-xs text-primary/50 font-mono">No logs found.</div>
        ) : (
          conversations?.map((conv) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div
                className={`group flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                  isActive(conv.id)
                    ? "bg-primary/15 border-primary/50 hud-glow"
                    : "bg-transparent border-transparent hover:bg-primary/5 hover:border-primary/20"
                }`}
              >
                <Link href={`/c/${conv.id}`} className="flex-1 min-w-0 flex items-center gap-3">
                  <MessageSquare
                    size={14}
                    className={isActive(conv.id) ? "text-primary" : "text-primary/50"}
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-sm font-medium ${
                        isActive(conv.id) ? "text-primary-foreground" : "text-primary/70"
                      }`}
                    >
                      {conv.title}
                    </div>
                    <div className="text-[10px] text-primary/40 font-mono mt-0.5">
                      {format(new Date(conv.createdAt), "MMM dd, HH:mm:ss")}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (confirm("Purge this communication log?")) {
                      deleteConv.mutate({ id: conv.id });
                    }
                  }}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive text-primary/50 rounded transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Bottom Panels */}
      <div className="shrink-0">
        <QuickCommands onCommand={onQuickCommand ?? (() => {})} />
        <TasksPanel />
      </div>
    </div>
  );
}
