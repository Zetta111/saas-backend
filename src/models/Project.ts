import {pool} from '../config/database';
import { logger} from '../config/logger';

export interface Project{
    id:string;
    org_id:string;
    name :string;
    description:string | null;
    created_by:string;
    created_at: Date;
    updated_at:Date;
}

export class ProjectModel{
    static async findById(orgId:string, projectId:string):Promise<Project | null>{
       try{
        const result =await pool.query(
            `SELECT * FROM projects WHERE org_id = $1 and id=$2`,
            [orgId,projectId]
        );return result.rows[0]||null;
       }catch(error){
        logger.error('Error finding project by ID',{orgId,projectId,error});
        throw error;
       }
    }

    static async findByOrganization(
        orgId: string,
        limit:number=50,
        offset:number=0

    ):Promise<Project[]>{
        try{
            const result = await pool.query(
                `SELECT * FROM projects
                WHERE org_id = $1
                ORDER BY created_at DESC
                LIMIT $2 OFFSET $3`,
                [orgId,limit,offset]
            );
            return result.rows;
        }catch(error){
            logger.error('Error finding project by Organization', {orgId,error});
            throw error;
        }
    }

    static async create(
        orgId:string,
        name:string,
        description:string|null,
        createdBy:string
    ):Promise<Project>{
        try{
            const result = await pool.query(
                `INSERT INTO projects (org_id,name,description,created_by)
                VALUES ($1,$2,$3,$4)
                RETURNING *`,
                [orgId,name,description,createdBy]
            );
            logger.info('Project created',{
                orgId,
                projectId:result.rows[0].id,
                name
            });
            return result.rows[0];
        }catch(error){
            logger.error('Error creating project',{orgId,name,error});
            throw error;
        }
    }

    static async update(
    orgId:string,
    projectId:string,
    data:{name?:string; description?:string}
    ):Promise<Project | null>{
        try{
            const updates:string[]=[];
            const values:any[]=[orgId];
            let paramCount=2;

            if(data.name){
                updates.push(`name=$${paramCount++}`);
                values.push(data.name);
            }
            if(data.description!==undefined){
                updates.push(`description=$${paramCount++}`);
                values.push(data.description);
            }
            if(updates.length===0){
                return this.findById(orgId,projectId);
            }
            updates.push(`updated_now=NOW()`);
            values.push(projectId);

            const result=await pool.query(
                `UPDATE projects
                SET ${updates.join(',')}
                WHERE ORG_ID=$1 AND ID=$${paramCount}
                RETURNING *`,
                values
            );
            logger.info('Project updated', {orgId,projectId});
            return result.rows[0]||null;
            }catch(error){
            logger.error('Error updating project',{orgId,projectId,error});
            throw error; 
        }
    }

    static async delete(orgId:string,projectId:string):Promise<boolean>{
        try{
            const result =await pool.query(
                `DELETE FROM projects WHERE org_id =$1 AND id=$2 RETURNING id`,
                [orgId,projectId]
            );
            logger.info('Project deleted', { orgId, projectId });
            return (result.rowCount ?? 0) > 0;
        } catch (error) {
            logger.error('Error deleting project', { orgId, projectId, error });
            throw error;
        }

    }

    static async countByOrganization(orgId:string):Promise<number>{
        try{
            const result =await pool.query(
                `SELECT COUNT(*) as count FROM projects WHERE org_id=$1`,
                [orgId]
            );
            return parseInt(result.rows[0].count,10);
        }catch(error){
            logger.error('Error counting prrojects', {orgId,error});
            throw error;
        }
    }

    static async addMember(
        orgId:string,
        projectId:string,
        userId:string
    ):Promise<void>{
        try{
            const project=await this.findById(orgId,projectId);
            if(!project){
                throw new Error('Project not found in organization');
            }

            await pool.query(
                `INSERT INTO project_members (project_id,user_id)
                VALUES ($1,$2)
                ON CONFLICT (project_id,user_id) DO NOTHING`,
                [projectId,userId]
            );
            logger.info('User added to project', {orgId,projectId,userId});
        }catch(error){
            logger.error('Error adding memebr to project',{
                orgId,
                projectId,
                userId,
                error
            });
            throw error;
        }
    }

    static async removeMember(
        orgId:string,
        projectId:string,
        userId:string
    ):Promise<boolean>{
        try{
            const project = await this.findById(orgId,projectId);
            if(!project){
                throw new Error('Project not found in organization');
            }
            const result = await pool.query(
                `DELETE FROM project_members WHERE project_id =$1 AND user_id=$2`,
                [projectId,userId]
            );
            logger.info('User removed from project',{orgId,projectId,userId});
            return (result.rowCount ?? 0)>0;
        }catch(error){
            logger.error('Error removing member from project',{
                orgId,
                projectId,
                userId,
                error

            });
            throw error;
        }
    }
}