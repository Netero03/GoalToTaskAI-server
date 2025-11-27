// routes/tasks.js
import express from 'express';
import Joi from 'joi';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import {
  createTask,
  getTask,
  updateTask,
  deleteTask,
  bulkReorder
} from '../controllers/taskController.js';

const router = express.Router();

const createSchema = Joi.object({
  projectId: Joi.string().required(),
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().allow('').optional(),
  estimatedHours: Joi.number().min(0).optional(),
  priority: Joi.string().valid('high','medium','low').optional(),
  assignee: Joi.string().optional()
});

const updateSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().allow('').optional(),
  estimatedHours: Joi.number().min(0).optional(),
  priority: Joi.string().valid('high','medium','low').optional(),
  status: Joi.string().valid('todo','inprogress','done').optional(),
  assignee: Joi.string().optional(),
  order: Joi.number().optional()
});

const bulkSchema = Joi.object({
  projectId: Joi.string().required(),
  orders: Joi.array().items(
    Joi.object({
      taskId: Joi.string().required(),
      order: Joi.number().required(),
      status: Joi.string().valid('todo','inprogress','done').optional()
    })
  ).min(1).required()
});

// bulk reorder
router.put('/reorder', requireAuth, validateBody(bulkSchema), bulkReorder);

// CRUD routes
router.post('/', requireAuth, validateBody(createSchema), createTask);
router.get('/:id', requireAuth, getTask);
router.put('/:id', requireAuth, validateBody(updateSchema), updateTask);
router.delete('/:id', requireAuth, deleteTask);


export default router;
