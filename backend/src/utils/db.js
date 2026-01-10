const { pool } = require('../config/database');

class DB {
  static async query(sql, params = []) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('Database query error:', error.message);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  static async findOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  }

  static async insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const [result] = await pool.execute(sql, values);
    
    return { id: result.insertId, ...data };
  }

  static async update(table, data, where) {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    
    const values = [...Object.values(data), ...Object.values(where)];
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    
    await pool.execute(sql, values);
    return data;
  }

  static async delete(table, where) {
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    
    await pool.execute(sql, Object.values(where));
    return true;
  }
}

module.exports = DB;