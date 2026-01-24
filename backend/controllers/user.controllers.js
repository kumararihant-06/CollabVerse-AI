import User from "../models/user.models.js";
import { createUserService } from "../services/index.js";
import {validationResult } from 'express-validator';

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