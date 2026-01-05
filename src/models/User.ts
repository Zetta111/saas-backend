
import {pool} from '../config/database';
import {logger} from '../config/logger';

export interface User{
    id:string;
    email:string;
    password_hash:string;
    first_name: string | null;
    last_name: string | null;
    is_active: boolean;
    created_at:Date;
    updated_at:Date;
}

export interface UserWithRole extends User{
    role_id:number;
    role_name:string;
    org_id:string;
}

export class userModel{
    static async findById(id:string):Promise< User | null>{
        try{
            const result = await pool.query(
                'SELECT * FROM users WHERE id = &1',
                [id]
            );
            return result.rows[0]||null;
        }catch(error){
            logger.error('Error finding user by ID',{id,error});
            throw error;
        }
        
    }

    static async findByEmail(email:string):Promise< User | null>{
        try{
            const result = await pool.query(
               ' SELECT * FROM users WHERE email = &1',
               [email]
            );
            return result.rows[0] || null;
        }catch(error){
            logger.error('Error cannot find user by email', {email,error});
            throw error;
        }
    }

    static async create(
        email:string,
        password_hash:string,
        firstName?:string,
        lastName?:string
    ):Promise<User>{
        try{
            const result = await pool.query(
                `INSERT INTO users (email,password_hash, first_name,last_name)
                VALUES ($1,$2,$3,$4)
                RETURNING *`,
                [email,password_hash,firstName||null,lastName||null]
            );
            logger.info('User created',{ userId:result.rows[0].id<email});
            return result.rows[0];
        }catch(error){
            logger.error('Error creating user',{email,error});
            throw error;
        }
    }

    static async update(
        id:string,
        data:{first_name?:string; last_name?:string; email?:string}
    ):Promise<User | null>{
        try{
            const updates :string[]=[];
            const values:any[]=[];
            let paramCount=1;

            if(data.first_name !== undefined){
                updates.push(`first_name=$${paramCount++}`);
                values.push(data.first_name);
            }  
            if(data.last_name!==undefined){
                updates.push(`last_name=$${paramCount++}`);
                 values.push(data.last_name);
            } 
            if(data.email){
                updates.push('email=$${paramCount++');
                values.push(data.email);
            }
            if(updates.length===0){
                return this.findById(id);
            }  
            updates.push(`updated_at=NOW()`);
            values.push(id);
            
            const result = await pool.query(
                `UPDATE users
                SET ${updates.join(',')}
                WHERE id = $${paramCount}
                RETURNING *`,
                values
            );
            logger.info('User updated',{userId:id});
            return result.rows[0]||null;
        }catch(error){
            logger.error('Error updating user',{id,error});
            throw error;
        }

    
    }

    static async findByOrganization(orgId:string):Promise<UserWithRole[]>{
        try{
            const result = await pool.query(
                `SELECT
                u.*,
                ou.role_id,
                r.name as role_name,
                ou.org_id,
            FROM users u,
            JOIN organization_users ou ON u.id=ou.user_id
            JOIN roles r ON ou.role_id = r.id
            WHERE ou.org_id = &1
            ORDER BY u.created_at DESC `,
            [orgId]
            );
            return result.rows;
        }catch(error){
            logger.error('Error finding users by organization', {orgId,error});
            throw error;
        }
    }

    static async getUserRole(userId:string,orgId:string):Promise<string | null>{
        try{
            const result = await pool.query(
                `SELECT r.name as role_name
                FROM organization_users ou
                JOIN roles r ON ou.role_id = r.id
                WHERE ou.user_id = $1 AND ou.org_id = $2`,
                [userId,orgId]
            );
            return result.rows[0]?.role_name || null;
        }catch (error){
            logger.error('Error getting user role', {userId,orgId,error});
            throw error;
        }
    }

    static async addToOrganization(
        userId:string,
        orgId:string,
        roleId:number
    ):Promise<void>{
        try{
            await pool.query(
                `INSERT INTO organization_users (user_id,org_id,role_id)
                VALUES ($1,$2,$3)`,
                [userId,orgId,roleId]
            );
            logger.info('User added to organization', {userId,orgId,roleId});

        }catch(error){
            logger.error('Error adding user to organization', {userId,orgId,roleId});
            throw error;
        }
    }

    static async updatePassword(id:string,passwordHash:string):Promise<void>{
        try{
            await pool.query(
                    `UPDATE users
                    SET password_hash = $1, updated_at =NOW()
                    WHERE id = $2`,
                    [passwordHash,id]
            );
            logger.info('User password updated', {userId:id});
        }catch(error){
            logger.error('Error updating password',{id,error});
            throw error;
        }
    }



}