import express from 'express';
import { config } from './config/env';
import { testDatabaseConnection, closeDatabaseConnection } from './config/database';
import { connectedRedis, closeRedisConnection } from './config/redis';
import { logger } from './config/logger';

const app=express();
app.use(express.json());

app.get('health', (req,res)=>{
    res.json({status :'ok',timestamp: new Date().toISOString()})
});


const startServer=async()=>{
    try{
        const dbConnected=await testDatabaseConnection();

        if(!dbConnected){
            throw new Error('Database connection failed');
        }
        const redisConnected = await connectedRedis();
        if(!redisConnected){
            throw new Error('Redis connection failed');
        }
        app.listen(config.PORT, ()=>{
            logger.info(`Server running on port ${config.PORT}`);
            logger.info(`Environment: ${config.NODE_ENV}`);
        });

    
    }catch(error){
        logger.error('Failed to start server', {error});
        process.exit(1);
    }
};

process.on('SIGTERM', async()=>{
    logger.info('SIGTERM recieved, shutting down gracefully');
    await closeDatabaseConnection();
    await closeRedisConnection();
    process.exit(1);
});

startServer();
export default app;

