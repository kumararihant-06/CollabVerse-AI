import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 1,      // fail fast instead of queueing indefinitely
    retryStrategy: (times) => {
        if (times > 5) return null; // stop retrying after 5 attempts
        return Math.min(times * 200, 2000);
    },
    lazyConnect: false,
});

redisClient.on('connect', () => {
    console.log("Redis Connected.");
});

redisClient.on('error', (err) => {
    console.log("Redis connection error:", err.message);
});


export default redisClient;