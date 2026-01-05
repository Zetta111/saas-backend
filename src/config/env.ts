interface EnvConfig{
    NODE_ENV : string;
    PORT : number;
    
    
    DATABASE_URL : string;
    DB_POOL_MIN: number;
    DB_POOL_MAX : number;


    REDIS_URL:string;
    REDIS_TTL:number;

    JWT_SECRET:string;
    JWT_REFRESH_SECRET:string;
    JWT_ACCESS_EXPIRY: String;
    JWT_REFRESH_EXPIRY:string;

    BCRYPT_ROUNDS :number;

    RATE_LIMIT_WINDOW:number;
    RATE_LIMIT_MAX_REQUESTS:number;

    LOG_LEVEL :string;
}

const requiredEnvVars=[
    'DATABASE_URL',
    'REDIS_UR',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
];

for(const envVar of requiredEnvVars){
    if(!process.env[envVar]){
        throw new Error(`Msiing required environment variables : ${envVar}`);
    }
}

export const config: EnvConfig = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),
    
    DATABASE_URL: process.env.DATABASE_URL!,
    DB_POOL_MIN: parseInt(process.env.DB_POOL_MIN || '2', 10),
    DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX || '10', 10),
    
    REDIS_URL: process.env.REDIS_URL!,
    REDIS_TTL: parseInt(process.env.REDIS_TTL || '3600', 10),
    
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
    JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
    JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
    
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    
    RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '3600', 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  };

