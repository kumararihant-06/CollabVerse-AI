import http from 'http';
import dotenv from 'dotenv';
dotenv.config()
import app from './app.js'
import connectDB from './config/db.config.js';
console.log(process.env.MONGODB_URI)
connectDB();

const PORT = process.env.PORT

const server  = http.createServer(app)

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

