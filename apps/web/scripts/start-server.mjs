#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT ?? (isProduction ? null : '3000');

if (!port) {
  console.error('PORT environment variable is required when NODE_ENV=production');
  process.exit(1);
}

const result = spawnSync(
  'npx',
  ['next', 'start', '--hostname', '0.0.0.0', '--port', String(port)],
  { stdio: 'inherit', env: process.env },
);

process.exit(result.status ?? 1);
