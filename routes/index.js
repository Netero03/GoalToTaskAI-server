// routes/index.js
import express from 'express';
import authRoutes from './auth.js';
import goalRoutes from './goals.js';
import projectRoutes from './projects.js';
import taskRoutes from './tasks.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/goals" , goalRoutes);     

router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);

// protected profile route
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    // req.user is attached by requireAuth
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
});

export default router;
