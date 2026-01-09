import{Request,Response,NextFunction} from 'express';
import {redisClient} from '../config/redis';
import{logger} from '../config/logger';
import{AppError} from './errorHandler.middleware';
import { partialMatchKey } from '@tanstack/react-query';

interface RateLimiterOptions{
    maxRequests?:number;
    window?:number;
    keyGenerator?:(req:Request) => string;
    message?:string;
    skipFailedRequests?:boolean;
    skip?:(req:Request)=>boolean;
}

interface RateLimitResult{
    allowed:boolean;
    remaining:number;
    resetTime:number;
    totalHits:number;
}

const checkRateLimit=async(
    key:string,
    maxRequests:number,
    windowSeconds:number
):Promise<RateLimitResult>=>{
    const now=Math.floor(Date.now()/1000);

    let resetTime= now+windowSeconds;
    try{
        const totalHits = await redisClient.incr(key);

        if(totalHits===1){
            await redisClient.expire(key, windowSeconds);
            resetTime= now+windowSeconds;
        }else{
            const ttl =await redisClient.ttl(key);
            if(ttl>0){
                resetTime = now + ttl;
            }
        }

        const allowed = totalHits <=maxRequests;
        const remaining = Math.max(0,maxRequests-totalHits);
        return{
            allowed,
            remaining,
            resetTime,
            totalHits

        };
    }catch(error){
        logger.error('rate limit check failed',{
            key,
            error:error instanceof Error? error.message:'Unknown error',
        });

        return{
            allowed:true,
            remaining:maxRequests,
            resetTime:now + windowSeconds,
            totalHits:0,
        };
    }
};