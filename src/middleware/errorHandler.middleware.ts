import {Request,Response,NextFunction} from 'express';
import {logger} from '../config/logger'

export class AppError extends Error{
    constructor(
        public statusCode:number,
        public message:string,
        public isOperational:boolean=true
    ){
        super(message);
        Object.setPrototypeOf(this,AppError.prototype);
    }
}

export class UnauthorizedError extends AppError{
    constructor(message:string='Unauthorized'){
        super(401,message);
    }
}

export class ForbiddenError extends AppError{
    constructor(message:string ='Forbidden'){
        super(403,message);
    }
}

export class NotFoundError extends AppError{
    constructor(message:string='Resource not found'){
        super(404,message);
    }
}

export class BadRequestError extends AppError{
    constructor(message:string='Bad request'){
        super(400,message);
    }
}

export const errorHandler=(
    err:Error | AppError,
    req:Request,
    res:Response,
    next:NextFunction
)=>{
    logger.error('Error occured',{
        message:err.message,
        stack:err.stack,
        path:req.path,
        method:req.method,
        userId:(req as any).user?.id,
        orgId:(req as any).orgContext?.orgId,
    });

    if(err instanceof AppError && err.isOperational){
        return res.status(err.statusCode).json({
            error:err.message,
            status:err.statusCode
        });
    }

    if(err.name==='JsonWebTokenError'){
        return res.status(401).json({
            error:'Invalid token',
            status:401,
        });
    }

    if(err.name==='TokenExpiredError'){
        return res.status(401).json({
            error:'Token expired',
            status:401,
        });
    }

    if(err.message.includes('duplicate key')){
        return res.status(409).json({
            error:'Resource already exists',
            status:409,
        });
    }

    if(err.message.includes('foreign key')){
        return res.status(400).json({
            error:'Invalid reference',
            status:400,
        });
    }

    res.status(500).json({
        error:'Internet server error',
        status:500,
    });
}

export const asyncHandler=(fn:Function)=>{
    return (req:Request,res:Response,next:NextFunction)=>{
        Promise.resolve(fn(req,res,next)).catch(next);
    };
};