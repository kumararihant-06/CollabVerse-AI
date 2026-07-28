import {AppError} from '../errors/AppError.js'
/**
 * Wraps an async socket.io event handler.
 * Catches both operational AppErrors and unexpected errors,
 * and emits a structured `error` event back to the originating socket
 * instead of crashing the process or silently swallowing the error.
 */

const socketAsyncHandler = (socket, fn) => async (...args) => {
    try {
        await fn(...args);
    } catch (err) {
        if(err instanceof AppError){
            // Operational error
            socket.emit("error", {
                success: false,
                statusCode: err.statusCode,
                message: err.message
            });
        } else {
            //Unexpected error
            console.log("[Socket Error] ", err);
            socket.emit("error", {
                success: false,
                statusCode:500,
                message: "An unexpected error occurred."
            });
        }
    }
};

export default socketAsyncHandler;