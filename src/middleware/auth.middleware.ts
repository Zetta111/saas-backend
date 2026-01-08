import {Request,Response,NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import {config} from '../config/env'
import {UserModel} from '../models/User'
import { UnauthorizedError } from './errorHandler.middleware';

declare global{
    namespace Express{
        interface Request{
            user?:{
                id:string;
                email:string;
                orgId?:String
                role?:string
            }
        }
    }
}


export const authMiddleware=async(
    req:Request,
    res:Response,
    next:NextFunction
)=>{
    try{
        const authHeader=req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer')){
            throw new UnauthorizedError('No token provided');
        }

        const token=authHeader.substring(7);

        const decoded = jwt.verify(token,config.JWT_SECRET) as {
            userId:string;
            email:string;
            orgId?:string;
            role?:string;
        };

        const user= await UserModel.findById(decoded.userId);

        if(!user){
            throw new UnauthorizedError('User not found');
        }

        if(!user.is_active){
            throw new UnauthorizedError('User account is deactivated');
        }

        req.user={
            id:user.id,
            email:user.email,
            orgId:decoded.orgId,
            role:decoded.role,
        };

        next();

    }catch(error){
        next(error);
    }
}

export const optionalAuth=async(
    req:Request,
    res:Response,
    next:NextFunction
)=>{
    try{
        const authHeader = req.headers.authorization;

        if(!authHeader||!authHeader.startsWith('Bearer')){
            return next();
        }

        const token=authHeader.substring(7);

        const decoded =jwt.verify(token,config.JWT_SECRET)as{
            userId:string;
            email:string;
            orgId?:string;
            role?:string;
        };

        const user=await UserModel.findById(decoded.userId);

        if(user && user.is_active){
            req.user={
                id:user.id,
                email:user.email,
                orgId:decoded.orgId,
                role:decoded.role,
            };
        }

        next();
    }catch(error){
        next();
    }
}