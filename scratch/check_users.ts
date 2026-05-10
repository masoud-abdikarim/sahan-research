
import { Client } from 'pg';
import 'dotenv/config';

async function checkUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  const res = await client.query(`
    SELECT id, email, phone FROM "User"
  `);
  
  console.log('Users in database:');
  console.table(res.rows);
  
  await client.end();
}

checkUsers().catch(console.error);
