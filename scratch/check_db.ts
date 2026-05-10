
import { Client } from 'pg';
import 'dotenv/config';

async function checkColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  const res = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'User'
  `);
  
  console.log('Columns in User table:');
  console.log(res.rows.map(r => r.column_name));
  
  await client.end();
}

checkColumns().catch(console.error);
