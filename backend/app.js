import express from 'express';
import ApiRoutes from './routes/index.js'
import cookieParser from 'cookie-parser';
import cors from 'cors';
const app = express()

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
export default app;

