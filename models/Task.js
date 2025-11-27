// models/Task.js
import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  estimatedHours: { type: Number, default: 0 },
  priority: { type: String, enum: ['high','medium','low'], default: 'medium' },
  status: { type: String, enum: ['todo','inprogress','done'], default: 'todo' },
  order: { type: Number, default: 0 },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
