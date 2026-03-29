import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { conversations, jarvisMessages } from "@workspace/db/schema";
import tasksRouter from "./tasks";
import { eq } from "drizzle-orm";
import {
  JarvisRouteBody,
  CreateJarvisConversationBody,
  GetJarvisConversationParams,
  DeleteJarvisConversationParams,
  SendJarvisMessageParams,
  SendJarvisMessageBody,
  ListJarvisMessagesParams,
} from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { generateImage } from "@workspace/integrations-gemini-ai/image";

const router: IRouter = Router();

type IntentType = "general" | "code" | "image" | "device" | "memory";

function classifyIntent(command: string): { intent: IntentType; provider: "gemini" | "claude"; confidence: number } {
  const lower = command.toLowerCase();

  const codeKeywords = [
    "code", "function", "debug", "error", "write a", "python", "javascript", "typescript",
    "script", "program", "algorithm", "class", "method", "api", "bug", "fix", "implement",
    "refactor", "explain this code", "what does this code", "compile", "syntax",
  ];
  const imageKeywords = [
    "generate an image", "create an image", "draw", "image of", "picture of",
    "generate a picture", "create a logo", "design an image", "render",
  ];
  const deviceKeywords = [
    "open chrome", "open firefox", "screenshot", "volume", "lock screen",
    "shut down", "restart", "copy", "paste", "scroll", "click", "type",
    "open app", "search on google", "open browser",
  ];
  const memoryKeywords = [
    "what was i working on", "remember", "remind me", "what did i ask",
    "show me files", "recent files", "task list", "notes",
  ];

  if (imageKeywords.some((kw) => lower.includes(kw))) {
    return { intent: "image", provider: "gemini", confidence: 0.95 };
  }
  if (codeKeywords.some((kw) => lower.includes(kw))) {
    return { intent: "code", provider: "claude", confidence: 0.9 };
  }
  if (deviceKeywords.some((kw) => lower.includes(kw))) {
    return { intent: "device", provider: "gemini", confidence: 0.85 };
  }
  if (memoryKeywords.some((kw) => lower.includes(kw))) {
    return { intent: "memory", provider: "gemini", confidence: 0.8 };
  }
  return { intent: "general", provider: "gemini", confidence: 0.7 };
}

const JARVIS_GEMINI_SYSTEM = `You are dashadikku, a personal AI assistant. Your name is dashadikku — not Jarvis, not anything else. If the user calls you Jarvis or any other name, gently correct them and remind them your name is dashadikku. Keep all responses short and spoken-friendly — no excessive markdown, no headers. Write responses as if you are speaking out loud to your owner. Today's date is ${new Date().toDateString()}.`;

const JARVIS_CLAUDE_SYSTEM = `You are dashadikku, a personal AI assistant specializing in code and technical tasks. Your name is dashadikku — not Jarvis, not anything else. If the user calls you Jarvis or any other name, gently correct them and remind them your name is dashadikku. Be concise and helpful. Explain code clearly. Today's date is ${new Date().toDateString()}.`;

const JARVIS_DEVICE_SYSTEM = `You are dashadikku, a personal AI assistant. Your name is dashadikku — not Jarvis, not anything else. If the user calls you Jarvis or any other name, gently correct them and remind them your name is dashadikku. The user is asking about device control. Acknowledge the command and explain what it would do on a Windows PC, since you are running on a web server and cannot actually control their PC directly. Be brief and helpful.`;

router.use("/tasks", tasksRouter);

router.post("/route", (req, res) => {
  const body = JarvisRouteBody.parse(req.body);
  const result = classifyIntent(body.command);
  res.json(result);
});

router.get("/conversations", async (_req, res) => {
  const all = await db
    .select()
    .from(conversations)
    .orderBy(conversations.createdAt);
  res.json(all);
});

router.post("/conversations", async (req, res) => {
  const body = CreateJarvisConversationBody.parse(req.body);
  const [conv] = await db.insert(conversations).values({ title: body.title }).returning();
  res.status(201).json(conv);
});

router.get("/conversations/:id", async (req, res) => {
  const { id } = GetJarvisConversationParams.parse({ id: Number(req.params.id) });
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const msgs = await db
    .select()
    .from(jarvisMessages)
    .where(eq(jarvisMessages.conversationId, id))
    .orderBy(jarvisMessages.createdAt);
  res.json({ ...conv, messages: msgs });
});

router.delete("/conversations/:id", async (req, res) => {
  const { id } = DeleteJarvisConversationParams.parse({ id: Number(req.params.id) });
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await db.delete(conversations).where(eq(conversations.id, id));
  res.status(204).send();
});

router.get("/conversations/:id/messages", async (req, res) => {
  const { id } = ListJarvisMessagesParams.parse({ id: Number(req.params.id) });
  const msgs = await db
    .select()
    .from(jarvisMessages)
    .where(eq(jarvisMessages.conversationId, id))
    .orderBy(jarvisMessages.createdAt);
  res.json(msgs);
});

router.post("/conversations/:id/messages", async (req, res) => {
  SendJarvisMessageParams.parse({ id: Number(req.params.id) });
  const conversationId = Number(req.params.id);
  const body = SendJarvisMessageBody.parse(req.body);

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
  if (!conv) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const { intent, provider, confidence } = classifyIntent(body.content);

  await db.insert(jarvisMessages).values({
    conversationId,
    role: "user",
    content: body.content,
    intent,
    provider,
  });

  const history = await db
    .select()
    .from(jarvisMessages)
    .where(eq(jarvisMessages.conversationId, conversationId))
    .orderBy(jarvisMessages.createdAt);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify({ intent, provider, confidence })}\n\n`);

  let fullResponse = "";

  try {
    if (intent === "image") {
      res.write(`data: ${JSON.stringify({ content: "Generating image..." })}\n\n`);
      const { b64_json, mimeType } = await generateImage(body.content);
      fullResponse = `[IMAGE:${mimeType}:${b64_json}]`;
      await db.insert(jarvisMessages).values({
        conversationId,
        role: "assistant",
        content: fullResponse,
        intent,
        provider,
      });
      res.write(`data: ${JSON.stringify({ image: { b64_json, mimeType }, done: true })}\n\n`);
      res.end();
      return;
    }

    if (provider === "claude") {
      const chatMessages = history
        .filter((m) => m.role !== "assistant" || m.content !== "")
        .map((m) => ({
          role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
          content: m.content,
        }));

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        system: intent === "device" ? JARVIS_DEVICE_SYSTEM : JARVIS_CLAUDE_SYSTEM,
        messages: chatMessages,
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          fullResponse += event.delta.text;
          res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
        }
      }
    } else {
      const chatMessages = history.map((m) => ({
        role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
        parts: [{ text: m.content }],
      }));

      const systemPrompt = intent === "device" ? JARVIS_DEVICE_SYSTEM : JARVIS_GEMINI_SYSTEM;

      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: chatMessages,
        config: {
          maxOutputTokens: 8192,
          systemInstruction: systemPrompt,
        },
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }
    }

    await db.insert(jarvisMessages).values({
      conversationId,
      role: "assistant",
      content: fullResponse,
      intent,
      provider,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    req.log.error({ err }, "Jarvis streaming error");
    res.write(`data: ${JSON.stringify({ error: "Failed to get response from AI" })}\n\n`);
  }

  res.end();
});

export default router;
