import {Request,Response,NextFunction} from 'express'
import {UserModel} from '../models/User';
import { ForbiddenError,UnauthorizedError } from './errorHandler.middleware';


declare global{
    namespace Express{
        interface Request{
            orgContext?:{
                orgId:string;
                userRole:string;
            }
        }
    }
}

export const tenantMiddleware=async(
    req:Request,
    res:Response,
    next:NextFunction
)=>{
    try{
        if(!req.user){
            throw new UnauthorizedError('Authentication required');
        }
        let orgId=
            req.headers['x-organization-id'] as string||
            req.params.orgId ||
            req.user.orgId;

        if(!orgId){
            throw new ForbiddenError('Organization context required');
        }
        
        
        const userRole = await UserModel.getUserRole(req.user.id, orgId as string);
        if(!userRole){
            throw new ForbiddenError('Access denied to this organization');
        }

        req.orgContext = {
            orgId: String(orgId),
            userRole: String(userRole),
        };

        next();
    }catch(error){
        next(error);
    }
}