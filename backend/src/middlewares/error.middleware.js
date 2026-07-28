import { AppError } from "../errors/AppError.js";

const errorMiddleware = (err, req, res, next) => {
    if(err instanceof AppError){
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }

    if(err.name === "CastError"){
        return res.status(400).json({
            success: false,
            message: `Invalid value for field: ${err.path}`
        });
    }

    if(err.code === 11000){
        const field = Object.keys(err.keyValue || {})[0] || "field";
        return res.status(400).json({
            success:false,
            message: `${field} already exists.`
        });
    }

    if(err.name === "ValidationError"){
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({
            success: false,
            message: messages.join(", ")
        });
    }

     if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
            success: false,
            message: "Invalid token.",
        });
    }
    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
            success: false,
            message: "Token has expired. Please log in again.",
        });
    }

    console.error("[Unhandled Error]", err);
    return res.status(500).json({
        success: false,
        message: "An unexpected internal server error occurred.",
    });
};

export default errorMiddleware;