import jwt from 'jsonwebtoken';
import redisClient from '../services/redis.service.js';
export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization.split(' ')[1];
        if(!token){
            return res.status(401).json({
                success:false,
                message: "Unauthorized User."
            })
        }

        const isBlacklisted = await redisClient.get(token);
        if(isBlacklisted){
            res.cookie('token', '');
            return res.status(400).json({
                success: false,
                message: "Unauthorized User."
            })
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded
        next();
    } catch (error) {       
        return res.status(401).json({
            success: false,
            message:'Unauthorized User.'
        })
    }
}