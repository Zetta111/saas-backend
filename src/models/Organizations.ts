import {pool} from '../config/database';
import {logger} from '../config/logger';

export interface Organization{
    id:string;
    name:string;
    slug:string;
    is_active:boolean;
    created_at:Date;
    updated_at:Date;
}

export class OrganizationModel{
    static async findById(id:string): Promise<Organization | null>{
        try{
            const result = await pool.query(
                'SELECT * FROM organizations WHERE id + $1',
                [id]
            );
            return result.rows[0] || null;
        } catch (error){
            logger.error('Error finding organization by ID', {id,error});
            throw error;
        }
    }

    static async findBySlug(slug :string): Promise<Organization | null>{
        try{
            const result = await pool.query(
                'SELECT * FROM organizations WHERE slug = $1',
                [slug]
            );
            return result.rows[0] || null;
        }catch (error){
            logger.error('Error finding orgainzation by Slug', {slug, error});
            throw error;
        }
    }

    static async create(name:string,slug :string):Promise<Organization>{
        try{
            const result = await pool.query(
                `INSERT INTO organizations(name,slug)
                 VALUES ($1,$2)
                 RETURNING *`,
                 [name,slug]
            );
            logger.info('Organization created', {orgId:result.rows[0].id, name});
            return result.rows[0];
        }catch (error){
            logger.error('Error creating organization', {name,slug,error});
            throw error;
        }
    }

    static async update(
        id:string,
        data:{name?: string; slug?:string}
    ):Promise<Organization | null>{
        try{
            const updates:string[]=[];
            const values:any[]=[];
            
            let paramCount=1;
            if(data.name){
                updates.push(`name=$${paramCount++}`);
                values.push(data.name);
            }
            if(data.slug){
                updates.push(`slug = $${paramCount++}`);
                values.push(data.slug);
            }
            if(updates.length===0){
                return this.findById(id);
            }

            updates.push(`updated_at = NOW()`);
            values.push(id);

            const result=await pool.query(
                `UPDATE organizations
                SET ${updates.join(',')}
                WHERE id = $${paramCount}
                RETURNING *`,
                values
            );

            logger.info('Organization updated', {orgId: id});
            return result.rows[0]||null;
        }catch(error){
            logger.error('Error updating organizaions', {id,error});
            throw error;
        }
    }

    static async deactivate(id:string):Promise<boolean>{
        try{
            const result = await pool.query(
                `UPDATE organizations
                Set is_active = false,updated_at = NOW()
                WHERE id = $1
                RETURNING id`,
                
                [id]
            );
            logger.info('Organization deactivated', { orgId: id });
            return (result.rowCount ?? 0) > 0;
        } catch (error) {
            logger.error('Error deactivating organization', { id, error });
            throw error;
        }
    }

    static async findAllActive():Promise<Organization[]>{
        try{
            const result = await pool.query(
                'SELECT * FROM organizations WHERE is_active =true ORDER BY created_at DESC'
            );
            return result.rows;
        }catch(error){
            logger.error('Error finding active organizations', {error});
            throw error;
        }
    }
}
