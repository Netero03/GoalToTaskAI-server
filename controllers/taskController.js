// controllers/taskController.js
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import mongoose from 'mongoose';

export async function createTask(req, res, next) {
  try {
    const { projectId, title, description, estimatedHours, priority, assignee } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const last = await Task.findOne({ projectId }).sort({ order: -1 }).lean();
    const order = last ? last.order + 1 : 0;

    const task = new Task({
      projectId,
      title,
      description: description || "",
      estimatedHours: estimatedHours || 0,
      priority: priority || "medium",
      status: "todo",
      order,
      assignee: assignee || null
    });

    await task.save();
    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
}

export async function getTask(req, res, next) {
  try {
    const { id } = req.params;

    const task = await Task.findById(id).lean();
    if (!task) return res.status(404).json({ error: "Task not found" });

    const project = await Project.findById(task.projectId).lean();
    if (!project || project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ error: "Access denied" });

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const project = await Project.findById(task.projectId);
    if (!project || project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ error: "Access denied" });

    const allowed = ["title", "description", "estimatedHours", "priority", "status", "assignee", "order"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) task[key] = req.body[key];
    }

    await task.save();
    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const project = await Project.findById(task.projectId);
    if (!project || project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ error: "Access denied" });

    await task.deleteOne();
    res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    next(err);
  }
}

export async function bulkReorder(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { projectId, orders } = req.body;

    if (!projectId || !Array.isArray(orders)) {
      throw Object.assign(new Error("Invalid payload"), { status: 400 });
    }

    const project = await Project.findById(projectId).session(session);
    if (!project) throw Object.assign(new Error("Project not found"), { status: 404 });
    if (project.owner.toString() !== req.user._id.toString())
      throw Object.assign(new Error("Access denied"), { status: 403 });

    const taskIds = orders.map((o) => o.taskId);

    const tasks = await Task.find({
      _id: { $in: taskIds },
      projectId
    }).session(session);

    if (tasks.length !== taskIds.length) {
      throw Object.assign(new Error("Some tasks do not belong to this project"), { status: 400 });
    }

    const bulkOps = orders.map((o) => ({
      updateOne: {
        filter: { _id: o.taskId },
        update: {
          $set: {
            order: o.order,
            ...(o.status ? { status: o.status } : {})
          }
        }
      }
    }));

    await Task.bulkWrite(bulkOps, { session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, message: "Tasks reordered" });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
}
