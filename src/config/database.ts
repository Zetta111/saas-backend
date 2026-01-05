import{Pool} from 'pg';
import{config} from './env';
import{logger} from './logger';

export const pool =new Pool({
    connectionString: config.DATABASE_URL,
    min :config.DB_POOL_MIN,
    max : config.DB_POOL_MAX,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis:2000,
});

pool.on('error', (err:Error)=>{
    logger.error('Unexpected database pool error',{error:err.message});
});

export const testDatabaseConnection=async():Promise<boolean> =>{
    try{
        const client=await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        logger.info('Database connection succesful');
        return true;
    }catch(error){
        logger.error('Database connection failed',{error});
        return false;
    }
};

export const queryWithOrgScope=async(
    orgId:string,
    sql:string,
    params:any[]=[]
):Promise<any>=>{
    const client = await pool.connect();

    try{
        await client.query('Set LOCAL app.current_org_id =$1', [orgId]);
        const result = await client.query(sql,params);
        return result;

    }finally{
        client.release();
    }
};

export const closeDatabaseConnection=async ():Promise<void>=>{
    try{
        await pool.end();
        logger.info('Database pool closed');

    }catch(error){
        logger.error('Error closing database pool', {error});
    }
};

