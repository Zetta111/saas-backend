/// <reference types="node" />
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool= new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runMigrations(specificFile?: string){
    const migrationsDir= path.join(__dirname, '../src/database/migrations');
    
    let files: string[];
    if (specificFile) {
        // Run specific migration file
        const filePath = path.join(migrationsDir, specificFile);
        if (!fs.existsSync(filePath)) {
            console.error(`Migration file not found: ${specificFile}`);
            process.exit(1);
        }
        files = [specificFile];
    } else {
        // Run all migrations
        files = fs.readdirSync(migrationsDir)
            .filter((file: string) => file.endsWith('.sql'))
            .sort();
    }
    
    console.log('Running migration...');
    for(const file of files){
        if(!file.endsWith('.sql'))continue;

        console.log(`Running ${file}...`);
        const sql = fs.readFileSync(path.join(migrationsDir,file), 'utf-8');

        try{
            await pool.query(sql);
            console.log(`${file} completed`);
        }catch(error){
            console.log(`Error in ${file}: `, error);
            process.exit(1);
        }

    }

    console.log('Migration(s) completed');
    await pool.end();
    process.exit(0);
}

// Check if a specific file was provided as argument
const specificFile = process.argv[2];
runMigrations(specificFile);