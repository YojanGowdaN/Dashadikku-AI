import { useState } from "react";
import {
  useListJarvisTasks,
  useCreateJarvisTask,
  useUpdateJarvisTask,
  useDeleteJarvisTask,
} from "@workspace/api-client-react";
import { Plus, CheckCircle, Circle, Trash2, AlertTriangle, ChevronDown, ChevronUp, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

const PRIORITY_STYLES: Record<string, string> = {
  high: "text-red-400 border-red-500/40",
  normal: "text-yellow-400 border-yellow-500/40",
  low: "text-primary/60 border-primary/30",
};

export function TasksPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("normal");
  const [isAdding, setIsAdding] = useState(false);

  const { data: tasks, isLoading } = useListJarvisTasks();
  const createTask = useCreateJarvisTask({ mutation: {} });
  const updateTask = useUpdateJarvisTask({ mutation: {} });
  const deleteTask = useDeleteJarvisTask({ mutation: {} });

  const pendingCount = tasks?.filter((t) => t.status === "pending").length ?? 0;

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    createTask.mutate(
      { data: { title: newTitle.trim(), priority: newPriority } },
      {
        onSuccess: () => {
          setNewTitle("");
          setIsAdding(false);
        },
      }
    );
  };

  const toggleStatus = (id: number, current: string) => {
    const next = current === "pending" ? "done" : "pending";
    updateTask.mutate({ id, data: { status: next } });
  };

  return (
    <div className="border-t border-primary/20">
      {/* Header toggle */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-primary/70" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-primary/70">
            Tasks & Reminders
          </span>
          {pendingCount > 0 && (
            <span className="text-[10px] font-bold bg-primary/20 text-primary border border-primary/40 rounded-full px-1.5 py-0.5 leading-none">
              {pendingCount}
            </span>
          )}
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
            <div className="px-3 pb-3 space-y-1 max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-3 text-xs text-primary/40 font-mono">Loading...</div>
              ) : tasks?.length === 0 ? (
                <div className="text-center py-3 text-xs text-primary/40 font-mono">No tasks yet.</div>
              ) : (
                tasks?.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "group flex items-start gap-2 p-2 rounded-lg border transition-all",
                      task.status === "done"
                        ? "border-primary/10 bg-primary/5 opacity-50"
                        : "border-primary/20 bg-secondary/20 hover:border-primary/40"
                    )}
                  >
                    <button
                      onClick={() => toggleStatus(task.id, task.status)}
                      className="mt-0.5 shrink-0 text-primary/60 hover:text-primary transition-colors"
                    >
                      {task.status === "done" ? (
                        <CheckCircle size={16} className="text-green-400" />
                      ) : (
                        <Circle size={16} />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-xs font-mono truncate",
                          task.status === "done" ? "line-through text-primary/40" : "text-primary/80"
                        )}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={cn(
                            "text-[9px] font-bold uppercase tracking-wider border rounded px-1",
                            PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.normal
                          )}
                        >
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span className="text-[9px] text-primary/40 font-mono">
                            Due {task.dueDate}
                          </span>
                        )}
                        <span className="text-[9px] text-primary/30 font-mono">
                          {format(new Date(task.createdAt), "MM/dd")}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTask.mutate({ id: task.id })}
                      className="opacity-0 group-hover:opacity-100 p-1 text-primary/40 hover:text-destructive transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}

              {/* Add task */}
              <AnimatePresence>
                {isAdding ? (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-2 pt-1"
                  >
                    <input
                      autoFocus
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAdd();
                        if (e.key === "Escape") setIsAdding(false);
                      }}
                      placeholder="Task title..."
                      className="w-full bg-background/80 border border-primary/30 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-primary/30 font-mono focus:outline-none focus:border-primary"
                    />
                    <div className="flex gap-2">
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value)}
                        className="flex-1 bg-background/80 border border-primary/20 rounded-lg px-2 py-1.5 text-xs text-primary/70 font-mono focus:outline-none focus:border-primary"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                      </select>
                      <button
                        onClick={handleAdd}
                        disabled={!newTitle.trim() || createTask.isPending}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/40 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/30 disabled:opacity-50 transition-all"
                      >
                        Add
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setIsAdding(true)}
                    className="w-full flex items-center gap-2 p-2 text-primary/50 hover:text-primary text-xs font-mono uppercase tracking-wider transition-colors"
                  >
                    <Plus size={14} />
                    Add task
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
