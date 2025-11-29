// server.js
import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import { connectToDatabase } from './lib/db.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const PORT = process.env.PORT || 3001;

async function main() {
  await connectToDatabase();
  console.log('MongoDB connected');

  const app = express();

  app.use(cors({ 
    origin: ["https://goal-to-task-ai.vercel.app", "http://localhost:5173","http://localhost:3000"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  app.use('/api', apiRouter);

  // healthcheck
  app.get('/health', (req, res) => res.json({ ok: true, time: new Date() }));

  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

main().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});
