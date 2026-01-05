import winston from 'winston';
import {config} from './env';
import * as fs from 'fs';
import path, * as pth from 'path';

const logFormat = winston.format.combine(
    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
    winston.format.errors({stack:true}),
    winston.format.splat(),
    winston.format.json()
);

const consoleFormat=winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({format:'YYYY-MM-DD HH:MM:ss'}),
    winston.format.printf(({timestamp,level,message,...meta})=>{

        let msg=`${timestamp} [${level}]:${message}`;
        if(Object.keys(meta).length>0){
            msg+=`${JSON.stringify(meta)}`;
        }
    return msg;
    })
);

export const logger=winston.createLogger({
    level:config.LOG_LEVEL,
    format:logFormat,
    defaultMeta:{service : 'saas-backend'},
    transports:[
        new winston.transports.Console({
            format:config.NODE_ENV === 'development'? consoleFormat:logFormat,
        }),
        new winston.transports.File({
            filename:'logs/error.log',
            level:'error',
            maxsize:5242880,
            maxFiles:5
        }),
        new winston.transports.File({
            filename:'logs/combines.log',
            level:'error',
            maxsize:5242880,
            maxFiles:5
        }),

    ],
});

const logsDir=path.join(process.cwd(),'logs');
if(!fs.existsSync(logsDir)){
    fs.mkdirSync(logsDir);
}