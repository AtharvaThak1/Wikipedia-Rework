import express from "express";
import { summary } from "../controllers/summary.controller.js";

const router = express.Router();

router.get("/summary", summary);

export default router;
