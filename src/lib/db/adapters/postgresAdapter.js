
import pg from 'pg';
const { Pool } = pg;

export async function createPostgresAdapter(connectionString) {
  const pool = new Pool({ connectionString });
  
  return {
    driver: 'postgres',
    query: async (sql, params = []) => {
      const res = await pool.query(sql, params);
      return res.rows;
    },
    run: async (sql, params = []) => {
      await pool.query(sql, params);
    },
    transaction: async (fn) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn({
          query: async (sql, params = []) => (await client.query(sql, params)).rows,
          run: async (sql, params = []) => { await client.query(sql, params); }
        });
        await client.query('COMMIT');
        return result;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }
  };
}
