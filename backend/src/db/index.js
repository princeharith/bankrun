import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

// Use the DATABASE_URL from .env
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in environment variables');
}

// Create postgres connection
const client = postgres(connectionString, {
    max: 10,
    ssl: 'require'
});

// Create drizzle instance
export const db = drizzle(client, { schema });

console.log('✅ Database connection established');

export default db;