import express from 'express';
import ApiRoutes from './routes/index.js'
const app = express()

app.use(express.json());
app.use(express.urlencoded({extended: true}))

app.use("/api", ApiRoutes )
export default app;

