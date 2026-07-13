const db = require('../config/db');

const logAction = async (userId, action, details) => {
  try {
    await db.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [userId, action, typeof details === 'string' ? details : JSON.stringify(details)]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
};

module.exports = logAction;
