import { Router, type IRouter } from "express";
import healthRouter from "./health";
import geminiRouter from "./gemini";
import anthropicRouter from "./anthropic";
import jarvisRouter from "./jarvis";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/gemini", geminiRouter);
router.use("/anthropic", anthropicRouter);
router.use("/jarvis", jarvisRouter);

export default router;
