import express from "express";
import { details } from "../controllers/detail.controller.js";

const router = express.Router();

router.get("/details/:title", details);

export default router;
