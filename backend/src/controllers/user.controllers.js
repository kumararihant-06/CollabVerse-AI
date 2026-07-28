import User from "../models/user.models.js";
import { createUserService, getUserInfoService, loginUserService } from "../services/index.js";
import {validationResult } from 'express-validator';
import redisClient from "../services/redis.service.js";
import { BadRequestError } from "../errors/AppError.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const createUserController = asyncHandler(async (req, res) =>{
    const errors = validationResult(req);

    if(!errors.isEmpty()) throw new BadRequestError(errors.array()[0].msg);
    
        const newUser = await createUserService(req.body)
        const token = newUser.generateJWT();
        return res.status(201).json({
            success:true,
            message: "User created Successfully.",
            user: {
                ...newUser._doc,
                password: undefined
            },
            token
        });    
});

export const loginUserController = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) throw new BadRequestError(errors.array()[0].msg);

        const user = await loginUserService(req.body)
        const token = user.generateJWT()
        return res.status(200).json({
            success: true,
            message: "User logged in successfully.",
            user: {
                ...user._doc,
                password: undefined
            },
            token
        })
});

export const profileUserController = asyncHandler(async (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Authorized User",
        user: req.user
           
    })
})

export const logoutUserController = asyncHandler(async (req, res) => {
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

        await redisClient.set(token, 'logout', 'EX', 60*60*12);

        return res.status(200).json({
            success: true,
            message: "Logged out successfully."
        });
    
});

export const getUserInfoController = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) throw new BadRequestError(errors.array()[0].msg);

        const {email} = req.body;
        const user = await getUserInfoService({email});
        
        return res.status(200).json({
            success: true,
            message: "User info fetched successfully.",
            user
        });
})