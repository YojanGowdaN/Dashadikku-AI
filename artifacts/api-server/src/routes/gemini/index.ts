import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  CreateGeminiConversationBody,
  GetGeminiConversationParams,
  DeleteGeminiConversationParams,
  ListGeminiMessagesParams,
  SendGeminiMessageParams,
  SendGeminiMessageBody,
  GenerateGeminiImageBody,
} from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";
import { generateImage } from "@workspace/integrations-gemini-ai/image";

const router: IRouter = Router();

const JARVIS_SYSTEM = `You are Jarvis, a personal AI assistant. Keep all responses short and spoken-friendly — no markdown, no bullet points, no headers. Write responses as if you are speaking out loud to your owner. Today's date is ${new Date().toDateString()}.`;

router.get("/conversations", async (req, res) => {
  const all = await db.select().from(conversations).orderBy(conversations.createdAt);
  res.json(all);
});

router.post("/conversations", async (req, res) => {
  const body = CreateGeminiConversationBody.parse(req.body);
  const [conv] = await db.insert(conversations).values({ title: body.title }).returning();
  res.status(201).json(conv);
});

router.get("/conversations/:id", async (req, res) => {
  const { id } = GetGeminiConversationParams.parse({ id: Number(req.params.id) });
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
  res.json({ ...conv, messages: msgs });
});

router.delete("/conversations/:id", async (req, res) => {
  const { id } = DeleteGeminiConversationParams.parse({ id: Number(req.params.id) });
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await db.delete(conversations).where(eq(conversations.id, id));
  res.status(204).send();
});

router.get("/conversations/:id/messages", async (req, res) => {
  const { id } = ListGeminiMessagesParams.parse({ id: Number(req.params.id) });
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
  res.json(msgs);
});

router.post("/conversations/:id/messages", async (req, res) => {
  SendGeminiMessageParams.parse({ id: Number(req.params.id) });
  const conversationId = Number(req.params.id);
  const body = SendGeminiMessageBody.parse(req.body);

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
  if (!conv) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.insert(messages).values({ conversationId, role: "user", content: body.content });

  const history = await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);

  const chatMessages = history.map((m) => ({
    role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
    parts: [{ text: m.content }],
  }));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: chatMessages,
      config: {
        maxOutputTokens: 8192,
        systemInstruction: JARVIS_SYSTEM,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    await db.insert(messages).values({ conversationId, role: "assistant", content: fullResponse });
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    req.log.error({ err }, "Gemini streaming error");
    res.write(`data: ${JSON.stringify({ error: "Failed to get response" })}\n\n`);
  }

  res.end();
});

router.post("/generate-image", async (req, res) => {
  const body = GenerateGeminiImageBody.parse(req.body);
  const result = await generateImage(body.prompt);
  res.json(result);
});

export default router;
