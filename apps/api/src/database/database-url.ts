import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

function parseDatabaseUrl(databaseUrl: string): PostgresConnectionOptions {
  const url = new URL(databaseUrl);
  const database = url.pathname.replace(/^\//, '');

  if (!database) {
    throw new Error('DATABASE_URL must include a database name.');
  }

  const sslMode = url.searchParams.get('sslmode');
  const ssl =
    sslMode === 'require' || sslMode === 'verify-full' || sslMode === 'verify-ca'
      ? { rejectUnauthorized: sslMode !== 'require' }
      : undefined;

  return {
    type: 'postgres',
    host: url.hostname,
    port: Number(url.port || 5432),
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    ...(ssl ? { ssl } : {}),
  };
}

function buildFromDiscreteEnv(): PostgresConnectionOptions {
  return {
    type: 'postgres',
    host: process.env.AOM_DB_HOST ?? 'localhost',
    port: Number(process.env.AOM_DB_PORT ?? 5432),
    username: process.env.AOM_DB_USERNAME ?? 'aomlegacy',
    password: process.env.AOM_DB_PASSWORD ?? 'aomlegacy',
    database: process.env.AOM_DB_NAME ?? 'aomlegacy',
  };
}

export function buildPostgresTypeOrmOptions(): PostgresConnectionOptions {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    return parseDatabaseUrl(databaseUrl);
  }

  return buildFromDiscreteEnv();
}
