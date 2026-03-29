import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  CreateAnthropicConversationBody,
  GetAnthropicConversationParams,
  DeleteAnthropicConversationParams,
  ListAnthropicMessagesParams,
  SendAnthropicMessageParams,
  SendAnthropicMessageBody,
} from "@workspace/api-zod";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router: IRouter = Router();

const JARVIS_SYSTEM = `You are Jarvis, a personal AI assistant specializing in code and technical tasks. Keep all responses short and spoken-friendly. Avoid markdown headers and excessive bullet points. Write responses as if you are speaking out loud to your owner. Today's date is ${new Date().toDateString()}.`;

router.get("/conversations", async (req, res) => {
  const all = await db.select().from(conversations).orderBy(conversations.createdAt);
  res.json(all);
});

router.post("/conversations", async (req, res) => {
  const body = CreateAnthropicConversationBody.parse(req.body);
  const [conv] = await db.insert(conversations).values({ title: body.title }).returning();
  res.status(201).json(conv);
});

router.get("/conversations/:id", async (req, res) => {
  const { id } = GetAnthropicConversationParams.parse({ id: Number(req.params.id) });
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
  res.json({ ...conv, messages: msgs });
});

router.delete("/conversations/:id", async (req, res) => {
  const { id } = DeleteAnthropicConversationParams.parse({ id: Number(req.params.id) });
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await db.delete(conversations).where(eq(conversations.id, id));
  res.status(204).send();
});

router.get("/conversations/:id/messages", async (req, res) => {
  const { id } = ListAnthropicMessagesParams.parse({ id: Number(req.params.id) });
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
  res.json(msgs);
});

router.post("/conversations/:id/messages", async (req, res) => {
  SendAnthropicMessageParams.parse({ id: Number(req.params.id) });
  const conversationId = Number(req.params.id);
  const body = SendAnthropicMessageBody.parse(req.body);

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
  if (!conv) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.insert(messages).values({ conversationId, role: "user", content: body.content });

  const history = await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);

  const chatMessages = history.map((m) => ({
    role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
    content: m.content,
  }));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: JARVIS_SYSTEM,
      messages: chatMessages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        fullResponse += event.delta.text;
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }

    await db.insert(messages).values({ conversationId, role: "assistant", content: fullResponse });
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    req.log.error({ err }, "Anthropic streaming error");
    res.write(`data: ${JSON.stringify({ error: "Failed to get response" })}\n\n`);
  }

  res.end();
});

export default router;
