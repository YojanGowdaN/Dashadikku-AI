import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tasks } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  CreateJarvisTaskBody,
  UpdateJarvisTaskBody,
  DeleteJarvisTaskParams,
  UpdateJarvisTaskParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const all = await db.select().from(tasks).orderBy(tasks.createdAt);
  res.json(all);
});

router.post("/", async (req, res) => {
  const body = CreateJarvisTaskBody.parse(req.body);
  const [task] = await db
    .insert(tasks)
    .values({
      title: body.title,
      description: body.description ?? null,
      priority: body.priority ?? "normal",
      dueDate: body.dueDate ?? null,
    })
    .returning();
  res.status(201).json(task);
});

router.patch("/:id", async (req, res) => {
  const { id } = UpdateJarvisTaskParams.parse({ id: Number(req.params.id) });
  const body = UpdateJarvisTaskBody.parse(req.body);

  const [task] = await db
    .update(tasks)
    .set({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
    })
    .where(eq(tasks.id, id))
    .returning();

  res.json(task);
});

router.delete("/:id", async (req, res) => {
  const { id } = DeleteJarvisTaskParams.parse({ id: Number(req.params.id) });
  await db.delete(tasks).where(eq(tasks.id, id));
  res.status(204).send();
});

export default router;
