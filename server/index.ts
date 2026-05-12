import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRouter from './routes/auth.js';
import recordsRouter from './routes/records.js';
import groupsRouter from './routes/groups.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/records', recordsRouter);
app.use('/api/groups', groupsRouter);

// Serve static client build in production
const clientDistPath = join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// SPA fallback: any non-API route returns index.html
app.get('*', (_req, res) => {
  res.sendFile(join(clientDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
