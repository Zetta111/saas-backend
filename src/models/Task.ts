import {pool} from '../config/database';
import {logger} from '../config/logger';

export interface Task{
    id:string;
    org_id:string;
    project_id:string;
    title:string;
    description:string | null;
    status :string;
    assigned_to:string | null;
    created_by:string;
    created_at:Date;
    updated_at:Date;

}

export class TaskModel{
    static async findById(orgId:string, taskId:string):Promise<Task | null>{
        try{
            const result = await pool.query(
                `SELECT * FROM tasks WHERE org_id =$1 and id=$2`,
                [orgId,taskId]

            );
            return result.rows[0] || null;
        }catch(error){
            logger.error('Error finding task by ID', {orgId,taskId,error});
            throw error;
        }
    }

    static async findByProject(
        orgId:string,
        projectId:string,
        limit:number =100,
        offset:number =0
    ):Promise<Task[]>{
        try{
            const result = await pool.query(
                `SELECT * FROM tasks
                WHERE org_id=$1 AND project_id=$2
                ORDER BY created_at DESC
                LIMIT $3 OFFSET How $4`,
                [orgId,projectId,limit,offset]
            );
            return result.rows;
        }catch(error){
            logger.error('Error finding tasks by project',{orgId,projectId,error});
            throw error;
        }
    }

    static async findByAssigned(
        orgId:string,
        userId:string,
        limit:number=11,
        offset:number=0
    ):Promise<Task[]>{
       try{
        const result = await pool.query(
            `SELECT * FROM tasks
            WHERE org_id = $1 AND assigned_to = $2
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4`,
            [orgId,userId,limit,offset]
        );
        return result.rows;
       }catch(error){
            logger.error('Error finding tasks by assignee',{orgId,userId,error});
            throw error;
       }
    }

    static async findByStatus(
        orgId:string,
        status:string,
        limit:number=100,
        offset:number=0
    ):Promise<Task[]>{
        try{
            const result = await pool.query(
                `SELECT * FROM tasks
                WHERE org_id=$1 AND status =$2
                ORDER BY created_at DESC
                LIMIT $3 OFFSET $4`,
                [orgId,status,limit,offset]
            );
            return result.rows;
        }catch(error){
            logger.error('Error finding projects by status',{orgId,status,error});
            throw error;
        }
    }

    static async create(
        orgId:string,
        projectId:string,
        title:string,
        description:string |null,
        createdBy:string
    ):Promise<Task>{
        try{
            const result = await pool.query(
                `INSERT INTO tasks (org_id, project_id,title,description,created_by)
                VALUES ($1,$2,$3,$4,$5)
                RETURNING *`,
                [orgId,projectId,title,description,createdBy]
            );
            logger.info(`Task created`,{
                orgId,
                taskId:result.rows[0].id,
                projectId,
                title
            })
            return result.rows[0];
        }catch(error){
            logger.error('Error creating task',{orgId,projectId,title,error});
            throw error;
        }
    }
    static async update(
        orgId:string,
        taskId:string,
        data:{
            title?:string;
            description?:string;
            status?:string;
            assigned_to?:String| null;
        }
    ):Promise<Task | null>{
        try{
            const updates:string[]=[];
            const values:any[]=[orgId]
            let paramCount =2;

            if(data.title){
                updates.push(`title =$${paramCount++}`);
                values.push(data.title);
            }

            if(data.description!== undefined){
                updates.push(`description = $${paramCount++}`);
                values.push(data.description);
            }
            if(data.status){
                updates.push(`status =$${paramCount++}`);
                values.push(data.status);
            }
            if(data.assigned_to!==undefined){
                updates.push(`assigned_to = $${paramCount++}`);
                values.push(data.assigned_to);
            }
            if(updates.length===0){
                return this.findById(orgId,taskId);
            }
            updates.push(`updated_at=NOW()`)
            values.push(taskId);

            const result=await pool.query(
                `UPDATED tasks
                SET ${updates.join(',')}
                WHERE org_id=$1 and id = $${paramCount}
                RETURNING *`,
                values
            );
            logger.info('Task updated',{orgId,taskId});
            return result.rows[0]|| null;
        }catch(error){
            logger.error('Error updating task',{orgId,taskId,error});
            throw error;
        }
    }

    static async assignTo(
        orgId:string,
        taskId:string,
        userId:string | null
    ):Promise<Task | null>{
        try{
            const result = await pool.query(
                `UPDATE tasks
                SET assigned_to = $1, updated_at =NOW()
                WHERE org_id=$2 and id=$3
                RETURNING *`,
                [userId,orgId,taskId]
            );
            logger.info('Task assigned', {orgId,taskId,userId});
            return result.rows[0]||null;
        }catch(error){
            logger.error('Error assigning task',{orgId,taskId,userId,error});
            throw error;
        }
    }

    static async updateStatus(
        orgId:string,
        taskId:string,
        status:string
    ):Promise<Task|null>{
        try{
            const result = await pool.query(
                `UPDATE tasks
                SET status =$1, updated_at=NOW()
                WHERE org_id=$2 AND id=$3
                RETURNING *`,
                [status,orgId,taskId]
            );
            logger.info('Task status updated', {orgId,taskId,status});
            return result.rows[0]||null;
        }catch(error){
            logger.error('Error updating task status',{orgId,taskId,status,error});
            throw error;
        }
    }

    static async delete(orgId:string,taskId:string):Promise<boolean>{
        try{
            const result =await pool.query(
                `DELETE FROM tasks WHERE org_id=$1 AND id=$2 RETURNING id`,
                [orgId,taskId]
            );
            logger.info('Tasks deleted', {orgId,taskId});
            return (result.rowCount ??0)>0;
        }catch(error){
            logger.error('Error deleting task',{orgId,taskId,error});
            throw error;
        }
    }

    static async countByProject(orgId:string,projectId:string):Promise<number>{
        try{
            const result=await pool.query(
                `SELECT COUNT(*) as count FROM tasks WHERE org_id=$1 and project_id=$2`,
                [orgId,projectId]
            );
            return parseInt(result.rows[0].count,10);
        }catch(error){
            logger.error('Error counting tasks',{orgId,projectId,error});
            throw error;
        }
    }

    static async getProjectsStatus(orgId:string,projectId:string){
        try{
            const result =await pool.query(
                `SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status='pending' THEN 1 END) as pending,
                    COUNT(CASE WHEN status = 'in_progress' THEN 1 END)as in_prgress,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                    COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as unassigned
                FROM tasks
                WHERE org_id=$1 AND project_id=$2`,
                [orgId,projectId]
                
            );
            return result.rows[0];
        }catch(error){
            logger.error('Error getting project stats',{orgId,projectId,error});
            throw error;
        }
    }
}