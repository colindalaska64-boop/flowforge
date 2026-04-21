import { Pool } from 'pg';
import { runStartupChecks } from './startupChecks';

// Checks de sécurité au démarrage — crash immédiat si une variable critique manque
runStartupChecks();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export default pool;
