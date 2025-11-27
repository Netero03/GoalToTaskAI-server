// controllers/projectController.js
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import mongoose from 'mongoose';

/**
 * Create a simple project
 * body: { title, description, visibility }
 * owner: req.user._id
 */
export async function createProject(req, res, next) {
  try {
    const { title, description, visibility } = req.body;
    const project = new Project({
      title,
      description,
      owner: req.user._id,
      visibility: visibility || 'private'
    });
    await project.save();
    res.status(201).json({ success: true, project });
  } catch (err) { next(err); }
}

/**
 * Create a project and tasks from AI output
 * body: { title, description, estimatedTotalHours, tasks: [ { title, description, estimatedHours, priority } ], visibility }
 * This uses a transaction to create project + tasks atomically.
 */
export async function createProjectFromAI(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { title, description, tasks, visibility, estimatedTotalHours } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw Object.assign(new Error('tasks must be a non-empty array'), { status: 400 });
    }

    const project = await Project.create([{
      title,
      description: description || '',
      owner: req.user._id,
      visibility: visibility || 'private',
      metadata: { estimatedTotalHours: estimatedTotalHours || null }
    }], { session });

    const projectId = project[0]._id;

    // Create tasks with incremental order
    const tasksToCreate = tasks.map((t, idx) => ({
      projectId,
      title: t.title,
      description: t.description || '',
      estimatedHours: typeof t.estimatedHours === 'number' ? t.estimatedHours : 0,
      priority: t.priority || 'medium',
      status: 'todo',
      order: idx
    }));

    const createdTasks = await Task.insertMany(tasksToCreate, { session });

    await session.commitTransaction();
    session.endSession();

    // populate tasks for response
    const populated = await Project.findById(projectId).lean().exec();
    populated.tasks = createdTasks;

    res.status(201).json({ success: true, project: populated });
  } catch (err) {
    await session.abortTransaction().catch(()=>{});
    session.endSession();
    next(err);
  }
}

/**
 * List user's projects (paginated)
 * query: page, limit, visibility (optional)
 */
export async function listProjects(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
    const skip = (page - 1) * limit;

    // show only user's projects for now
    const filter = { owner: req.user._id };
    if (req.query.visibility) filter.visibility = req.query.visibility;

    const [total, projects] = await Promise.all([
      Project.countDocuments(filter),
      Project.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()
    ]);

    res.json({ success: true, total, page, limit, projects });
  } catch (err) { next(err); }
}

/**
 * Get project details with tasks (populate tasks sorted by order)
 */
export async function getProject(req, res, next) {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).lean();
    if (!project) return res.status(404).json({ error: 'Project not found' });
    // ensure owner can access (owner-only for now)
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tasks = await Task.find({ projectId: project._id }).sort({ order: 1, createdAt: 1 }).lean();
    project.tasks = tasks;
    res.json({ success: true, project });
  } catch (err) { next(err); }
}

/**
 * Update project (owner only)
 * body: { title?, description?, visibility? }
 */
export async function updateProject(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    Object.assign(project, updates);
    await project.save();
    res.json({ success: true, project });
  } catch (err) { next(err); }
}

/**
 * Delete project and its tasks (owner only)
 */
export async function deleteProject(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const project = await Project.findById(id).session(session);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await Task.deleteMany({ projectId: project._id }).session(session);
    await project.deleteOne({ session });
    await session.commitTransaction();
    session.endSession();
    res.json({ success: true, message: 'Project and tasks deleted' });
  } catch (err) {
    await session.abortTransaction().catch(()=>{});
    session.endSession();
    next(err);
  }
}
