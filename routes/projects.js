// routes/projects.js
import express from 'express';
import Joi from 'joi';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import {
  createProject,
  createProjectFromAI,
  listProjects,
  getProject,
  updateProject,
  deleteProject
} from '../controllers/projectController.js';

const router = express.Router();

// validation schemas
const createSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().allow('').max(2000).optional(),
  visibility: Joi.string().valid('private','team','public').optional()
});

const createFromAiSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().allow('').optional(),
  estimatedTotalHours: Joi.number().optional(),
  visibility: Joi.string().valid('private','team','public').optional(),
  tasks: Joi.array().items(
    Joi.object({
      title: Joi.string().required(),
      description: Joi.string().allow('').optional(),
      estimatedHours: Joi.number().optional(),
      priority: Joi.string().valid('high','medium','low').optional()
    })
  ).min(1).required()
});

const updateSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().allow('').optional(),
  visibility: Joi.string().valid('private','team','public').optional()
});

// routes
router.post('/', requireAuth, validateBody(createSchema), createProject);
router.post('/from-ai', requireAuth, validateBody(createFromAiSchema), createProjectFromAI);
router.get('/', requireAuth, listProjects);
router.get('/:id', requireAuth, getProject);
router.put('/:id', requireAuth, validateBody(updateSchema), updateProject);
router.delete('/:id', requireAuth, deleteProject);

export default router;
