// models/Project.js
import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  visibility: { type: String, enum: ['private','team','public'], default: 'private' },
  metadata: { type: Object, default: {} }
}, { timestamps: true });

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
