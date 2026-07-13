const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runSetup() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = parseInt(process.env.DB_PORT || '3306');
  const database = process.env.DB_NAME || 'heart_disease_db';

  console.log(`Starting database setup on ${host}:${port} as user "${user}"...`);

  let connection;
  try {
    const connConfig = {
      host,
      user,
      password,
      port
    };
    
    if (host !== 'localhost' && host !== '127.0.0.1') {
      connConfig.ssl = {
        rejectUnauthorized: true
      };
    }

    connection = await mysql.createConnection(connConfig);
    
    console.log('Connected to MySQL server.');

    // 2. Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // 3. Split queries by semicolon (taking care not to break nested structures, though our schema is simple)
    // We split by semicolon followed by a newline/carriage return to prevent splitting inside values.
    const queries = schemaSql
      .split(/;\s*[\r\n]+/)
      .map(q => q.trim())
      .filter(q => q.length > 0);

    // 4. Run queries sequentially
    for (let i = 0; i < queries.length; i++) {
      const sql = queries[i] + ';';
      console.log(`Executing query ${i + 1}/${queries.length}...`);
      try {
        await connection.query(sql);
      } catch (queryErr) {
        if (sql.toLowerCase().includes('create database') || sql.toLowerCase().includes('use ')) {
          console.warn(`[Tolerated] Skipper statement: ${queryErr.message}`);
        } else {
          throw queryErr;
        }
      }
    }

    console.log('Database and tables initialized successfully!');
  } catch (error) {
    console.error('Database setup failed:', error.message);
    console.error('Ensure that your MySQL server is running and credentials in backend/.env are correct.');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Setup connection closed.');
    }
  }
}

runSetup();
