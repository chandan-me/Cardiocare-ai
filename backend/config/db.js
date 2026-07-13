const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'heart_disease_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;
let useFallback = false;
let isInitialized = false;

const fallbackPath = path.join(__dirname, 'fallback_db.json');

// Helper to load/save JSON database
function loadFallbackDB() {
  if (!fs.existsSync(fallbackPath)) {
    // Hash password "admin123" for pre-seeded user
    const salt = bcrypt.genSaltSync(10);
    const hashedAdminPassword = bcrypt.hashSync('admin123', salt);

    const initialDB = {
      users: [
        {
          id: 1,
          name: 'Administrator',
          email: 'admin@pulse.org',
          password: hashedAdminPassword,
          role: 'admin',
          avatar: null,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      predictions: [
        {
          id: 1,
          user_id: 1,
          patient_name: 'Jane Doe',
          age: 45,
          gender: 0,
          cp: 1,
          trestbps: 120,
          chol: 210,
          fbs: 0,
          restecg: 0,
          thalach: 160,
          exang: 0,
          oldpeak: '0.4',
          slope: 0,
          ca: 0,
          thal: 1,
          result: 'Healthy',
          confidence: '94.20',
          recommendations: '### Lifestyle Tips\n- Maintain a balanced diet.\n- Stay hydrated.',
          created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          user_id: 1,
          patient_name: 'Robert Vance',
          age: 62,
          gender: 1,
          cp: 0,
          trestbps: 148,
          chol: 289,
          fbs: 1,
          restecg: 1,
          thalach: 115,
          exang: 1,
          oldpeak: '2.6',
          slope: 1,
          ca: 2,
          thal: 2,
          result: 'High Risk',
          confidence: '88.50',
          recommendations: '### Lifestyle Tips\n- Avoid tobacco.\n- Daily BP monitoring.',
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          user_id: 1,
          patient_name: 'Sarah Connor',
          age: 38,
          gender: 0,
          cp: 2,
          trestbps: 110,
          chol: 190,
          fbs: 0,
          restecg: 0,
          thalach: 170,
          exang: 0,
          oldpeak: '0.1',
          slope: 0,
          ca: 0,
          thal: 1,
          result: 'Healthy',
          confidence: '95.80',
          recommendations: '### Lifestyle Tips\n- Excellent vitals.',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 4,
          user_id: 1,
          patient_name: 'John Miller',
          age: 55,
          gender: 1,
          cp: 3,
          trestbps: 140,
          chol: 250,
          fbs: 0,
          restecg: 1,
          thalach: 125,
          exang: 1,
          oldpeak: '1.8',
          slope: 1,
          ca: 1,
          thal: 2,
          result: 'High Risk',
          confidence: '82.40',
          recommendations: '### Lifestyle Tips\n- Reduce sodium.',
          created_at: new Date().toISOString()
        }
      ]
    };
    fs.writeFileSync(fallbackPath, JSON.stringify(initialDB, null, 2));
    return initialDB;
  }
  const rawData = fs.readFileSync(fallbackPath, 'utf8');
  return JSON.parse(rawData);
}

function saveFallbackDB(data) {
  fs.writeFileSync(fallbackPath, JSON.stringify(data, null, 2));
}

// Helper to seed MySQL if it is empty
async function seedMySQLIfEmpty() {
  try {
    const [userRows] = await pool.execute('SELECT * FROM users WHERE email = ?', ['admin@pulse.org']);
    if (userRows.length === 0) {
      console.log('Seeding default administrator to MySQL users table...');
      const salt = bcrypt.genSaltSync(10);
      const hashedAdminPassword = bcrypt.hashSync('admin123', salt);
      await pool.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Administrator', 'admin@pulse.org', hashedAdminPassword, 'admin']
      );
      console.log('Seeded successfully: admin@pulse.org / admin123');
    }
  } catch (err) {
    console.warn('Could not auto-seed MySQL database:', err.message);
  }
}

let lastConnectionError = null;

// Initialise DB pool and test connection
async function initDB() {
  if (isInitialized) return;
  try {
    if (dbConfig.host !== 'localhost' && dbConfig.host !== '127.0.0.1') {
      dbConfig.ssl = {
        rejectUnauthorized: true
      };
    }
    pool = mysql.createPool(dbConfig);
    const conn = await pool.getConnection();
    conn.release();
    console.log(`Database connected successfully to ${dbConfig.host}:${dbConfig.port}`);
    await seedMySQLIfEmpty();
  } catch (error) {
    console.warn(`⚠️ MySQL Database connection failed: ${error.message}`);
    lastConnectionError = error.message;
    useFallback = true;
  }
  isInitialized = true;
}

// Emulate SQL queries in JS
async function queryFallback(sql, params = []) {
  const db = loadFallbackDB();
  const normalizedSql = sql.trim().replace(/\s+/g, ' ').toLowerCase();

  // 1. SELECT * FROM users WHERE email = ?
  if (normalizedSql.startsWith('select * from users where email =')) {
    const email = params[0];
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user ? [user] : [];
  }

  // 2. SELECT COUNT(*) as count FROM users
  if (normalizedSql.startsWith('select count(*) as count from users')) {
    return [{ count: db.users.length }];
  }

  // 3. INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)
  if (normalizedSql.startsWith('insert into users')) {
    const [name, email, password, role] = params;
    const newId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
    const newUser = {
      id: newId,
      name,
      email,
      password,
      role: role || 'user',
      avatar: null,
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    saveFallbackDB(db);
    return { insertId: newId };
  }

  // 4. INSERT INTO predictions
  if (normalizedSql.startsWith('insert into predictions')) {
    const [
      user_id, patient_name, age, gender, cp, trestbps, chol, fbs,
      restecg, thalach, exang, oldpeak, slope, ca, thal, result, confidence, recommendations
    ] = params;
    const newId = db.predictions.length > 0 ? Math.max(...db.predictions.map(p => p.id)) + 1 : 1;
    const newPrediction = {
      id: newId,
      user_id,
      patient_name,
      age: parseInt(age),
      gender: parseInt(gender),
      cp: parseInt(cp),
      trestbps: parseInt(trestbps),
      chol: parseInt(chol),
      fbs: parseInt(fbs),
      restecg: parseInt(restecg),
      thalach: parseInt(thalach),
      exang: parseInt(exang),
      oldpeak: parseFloat(oldpeak),
      slope: parseInt(slope),
      ca: parseInt(ca),
      thal: parseInt(thal),
      result,
      confidence: parseFloat(confidence).toFixed(2),
      recommendations,
      created_at: new Date().toISOString()
    };
    db.predictions.push(newPrediction);
    saveFallbackDB(db);
    return { insertId: newId };
  }

  // 5. SELECT COUNT(*) as total FROM predictions WHERE...
  if (normalizedSql.startsWith('select count(*) as total from predictions')) {
    let filtered = [...db.predictions];
    
    // Check if it's not admin filtering by user
    if (normalizedSql.includes('user_id = ?')) {
      const userId = params[0];
      filtered = filtered.filter(p => p.user_id == userId);
    }
    
    // Search filter
    const searchIdx = sql.indexOf('LIKE ?');
    if (searchIdx !== -1) {
      // Find search string in params (could be after user_id)
      const searchVal = params.find(p => typeof p === 'string' && p.startsWith('%'))?.replace(/%/g, '') || '';
      if (searchVal) {
        filtered = filtered.filter(p => 
          p.patient_name.toLowerCase().includes(searchVal.toLowerCase()) || 
          p.result.toLowerCase().includes(searchVal.toLowerCase())
        );
      }
    }
    
    // Result Filter
    if (normalizedSql.includes('result = ?')) {
      const resultVal = params[params.length - 1]; // usually the last parameter
      filtered = filtered.filter(p => p.result === resultVal);
    }

    return [{ total: filtered.length }];
  }

  // 6. SELECT * FROM predictions WHERE id = ?
  if (normalizedSql.startsWith('select * from predictions where id =')) {
    const id = parseInt(params[0]);
    const pred = db.predictions.find(p => p.id == id);
    return pred ? [pred] : [];
  }

  // 7. DELETE FROM predictions WHERE id = ?
  if (normalizedSql.startsWith('delete from predictions where id =')) {
    const id = parseInt(params[0]);
    const initialLen = db.predictions.length;
    db.predictions = db.predictions.filter(p => p.id != id);
    saveFallbackDB(db);
    return { affectedRows: initialLen - db.predictions.length };
  }

  // 8. SELECT * FROM predictions (Logs table or analytics load)
  if (normalizedSql.startsWith('select * from predictions') || normalizedSql.startsWith('select id, patient_name, age, result, created_at from predictions')) {
    let filtered = [...db.predictions];

    // Filter by user_id
    if (normalizedSql.includes('user_id = ?')) {
      const userId = params[0];
      filtered = filtered.filter(p => p.user_id == userId);
    }

    // Apply Search
    const searchIdx = sql.indexOf('LIKE ?');
    if (searchIdx !== -1) {
      const searchVal = params.find(p => typeof p === 'string' && p.startsWith('%'))?.replace(/%/g, '') || '';
      if (searchVal) {
        filtered = filtered.filter(p => 
          p.patient_name.toLowerCase().includes(searchVal.toLowerCase()) || 
          p.result.toLowerCase().includes(searchVal.toLowerCase())
        );
      }
    }

    // Apply Result filter
    if (normalizedSql.includes('result = ?')) {
      const resultVal = params.find(p => p === 'Healthy' || p === 'High Risk');
      if (resultVal) {
        filtered = filtered.filter(p => p.result === resultVal);
      }
    }

    // Sort descending by created_at
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Limit and Offset (Pagination)
    const limitMatch = sql.match(/LIMIT\s+(\?|\d+)/i);
    const offsetMatch = sql.match(/OFFSET\s+(\?|\d+)/i);

    if (limitMatch) {
      let limitVal = parseInt(limitMatch[1]);
      if (isNaN(limitVal)) {
        // Find limit value in params (usually second-to-last or last depending on offset)
        limitVal = params[params.length - 2];
      }
      
      let offsetVal = 0;
      if (offsetMatch) {
        offsetVal = parseInt(offsetMatch[1]);
        if (isNaN(offsetVal)) {
          offsetVal = params[params.length - 1];
        }
      }

      filtered = filtered.slice(offsetVal, offsetVal + limitVal);
    }

    return filtered;
  }

  return [];
}

// Helper to query with clean error reporting
async function query(sql, params) {
  await initDB();
  if (useFallback) {
    return queryFallback(sql, params);
  }
  try {
    const isLimitOffset = sql.toLowerCase().includes('limit') || sql.toLowerCase().includes('offset');
    const [results] = isLimitOffset
      ? await pool.query(sql, params)
      : await pool.execute(sql, params);
    return results;
  } catch (err) {
    console.error('Database Query Error, falling back to JSON:', err.message);
    return queryFallback(sql, params);
  }
}

function getDbStatus() {
  return {
    useFallback,
    isInitialized,
    host: dbConfig.host,
    user: dbConfig.user,
    port: dbConfig.port,
    database: dbConfig.database,
    connectionError: lastConnectionError
  };
}

module.exports = {
  pool,
  query,
  getDbStatus
};
