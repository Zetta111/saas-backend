import {Request,Response,NextFunction} from 'express';
import {logger} from '../config/logger';

export const requestLogger=(req:Request,res:Response,next:NextFunction)=>{
    const start=Date.now();

    res.on('finish',()=>{
        const duration=Date.now()-start;

        logger.info('HTTP Request',{
            method:req.method,
            path:req.path,
            statusCode:res.statusCode,
            duration:`${duration}ms`,
            ip:req.ip,
            userAgent:req.get('user-agent'),
            userId:(req as any).user?.id,
            orgId:(req as any).orgContext?.orgId,

        });
    });
    next();

}