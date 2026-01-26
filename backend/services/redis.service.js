import Redis from 'ioredis';

const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
})
try {
    redisClient.on('connect', () => {
    console.log("Redis Connected.")
})
} catch (error) {
    console.log("An error occurred: ",error);
}


export default redisClient;