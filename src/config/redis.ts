import {createClient} from 'redis';
import {config} from './env';
import{logger} from './logger';
export const redisClient = createClient({
    url:config.REDIS_URL,
    socket:{
        reconnectStrategy: (retries)=>{
            if(retries>10){
                logger.error('Redis reconnection limit reached');
                return new Error('Redis reconnection limit exceeded');
            }
            return Math.min(retries*100,3000);
        },
    },
});

redisClient.on('error', (err)=>{
    logger.error('Redis client Error', {error:err.message});
});

redisClient.on('connect', ()=>{
    logger.info('Redis Connected');
});

redisClient.on('reconnecting', ()=>{
    logger.warn('Redis reconnecting...');
});

export const connectedRedis=async():Promise<boolean>=>{
    try{
       await redisClient.connect(); 
       return true;
    }catch(error){
        logger.error('Redis connection failed', {error});
        return false;
    }
};

export const cacheSet=async(
    key:string,
    value:any,
    ttl:number=config.REDIS_TTL
):Promise<void>=>{
    try{
        await redisClient.setEx(key,ttl,JSON.stringify(value));
    }catch(error){
        logger.error('Redis Set Error', {key,error});
        throw error;
    }
};
export const cacheGet=async(key:string):Promise<any | null>=>{
    try{
        const data = await redisClient.get(key);
        return data ? JSON.parse(data):null;
    }catch(error){
        logger.error('Redis Get error', {key,error});
        return null;
    }
};

export const cacheDel = async(key:string):Promise<void>=>{
    try{
        await redisClient.del(key);
    }catch(error){
        logger.error('Redis DEL error',{key,error});
        throw error;
    }
};

export const checkRateLimit=async(
    key:string,
    maxRequests:number=config.RATE_LIMIT_MAX_REQUESTS,
    window:number=config.RATE_LIMIT_WINDOW
):Promise<{allowed:boolean; remaining:number}>=>{
    try{
        const count = await redisClient.incr(key);
        if(count===1){
            await redisClient.expire(key,window);
        }
        const allowed=count <=maxRequests;
        const remaining =Math.max(0,maxRequests-count);
        return {allowed,remaining};
    }catch(error){
        logger.error('Rate limit chech error');
        return {allowed:true, remaining:maxRequests};
    }
};

export const setSession=async(
    sessionId:string,
    data:any,
    ttl:number=86400
):Promise<void>=>{
    const key = `session: ${sessionId}`;
    await cacheSet(key,data,ttl);
};

export const getSession=async(sessionId:string):Promise<any | null>=>{
    const key = `session:${sessionId}`;
    return await cacheGet(key);
};

export const deleteSession=async(sessionId: string) : Promise<void>=>{
    const key = `session:${sessionId}`;
    await cacheDel(key);
};

export const closeRedisConnection=async ():Promise<void>=>{
    try{
        await redisClient.quit();
        logger.info('Redis connection closed');

    }catch(error){
        logger.error('Error closing Redis Connection', {error});
    }
};