// routes/goals.js
import express from "express";
import Joi from "joi";
import { validateBody } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { generateTasksFromGoal } from "../services/aiService.js";

const router = express.Router();

// Input validation schema
const generateSchema = Joi.object({
  goal: Joi.string().min(10).max(5000).required()
});

// POST /api/goals/generate
router.post(
  "/generate",
  requireAuth,
  validateBody(generateSchema),
  async (req, res, next) => {
    try {
      const { goal } = req.body;

      const aiResult = await generateTasksFromGoal(goal);

      res.json({
        success: true,
        data: aiResult
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
