import express from 'express';
import ApiRoutes from './routes/index.js'
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import errorMiddleware from './middlewares/error.middleware.js';
const app = express()

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use("/api", ApiRoutes )

app.use(errorMiddleware);
export default app;

