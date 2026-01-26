import express from 'express';
import ApiRoutes from './routes/index.js'
import cookieParser from 'cookie-parser';
const app = express()

app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())

app.use("/api", ApiRoutes )
export default app;

