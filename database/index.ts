
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { setupAuthRoutes } from './middleware/authHandlers';
import { setupUserRoutes } from './middleware/userHandlers';
import { setupEventRoutes } from './middleware/eventHandlers';

(BigInt.prototype as any).toJSON = function () {
  const int = Number.parseInt(this.toString());
  return int ?? this.toString();
};

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files (images, etc)

setupAuthRoutes(app, prisma);
setupEventRoutes(app, prisma);
setupUserRoutes(app, prisma);


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
