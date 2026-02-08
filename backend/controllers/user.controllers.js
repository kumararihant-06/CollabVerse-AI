import User from "../models/user.models.js";
import { createUserService, getUserInfoService, loginUserService } from "../services/index.js";
import {validationResult } from 'express-validator';
import redisClient from "../services/redis.service.js";

export const createUserController = async (req, res) =>{
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({
            errors: errors.array()
        }) 
    }
    
    try {
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
        })
    } catch (error) {
        console.log("An error occurred while creating user: ",error.message)
        return res.status(400).json({
            success: false,
            message: `An error occurred while creating the user: ${error.message}`
        })
    }
    
    
}

export const loginUserController = async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({
            errors : errors.array()
        })
    }

    try {
        
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
    } catch (error) {
        console.log("An error occurred while logging in: ",error.message)
        return res.status(400).json({
            success: false,
            message: `An error occurred while logging in: ${error.message}`
        })
    }
}

export const profileUserController = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Authorized User",
        user: req.user
           
    })
}

export const logoutUserController = async (req, res) => {
    try {
        const token = req.cookies.token || req.headers.authorization.split(' ')[1];

        redisClient.set(token, 'logout', 'EX', 60*60*12);
        return res.status(200).json({
            success: true,
            message: "Logged out successfully."
        })
    } catch (error) {
        console.log("An Error occurred: ",error.message)
        res.status(400).json({
            success: false,
            message: "Error occurred while Logging out."
        })
    }
}

export const getUserInfoController = async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({
            errors: errors.array()
        })
    }

    try {
        const {email} = req.body;
        const user = await getUserInfoService({email});
        return res.status(200).json({
            success: true,
            message: "User info fetched successfully.",
            user
        })
    } catch (error) {
        console.log("Error fetching user info: ", error.message)
        return res.status(500).json({
            success: false,
            message: "Error fetching user info."
        })
    }
}