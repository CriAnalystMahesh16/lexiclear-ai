/**
 * LexiClear AI - Full-Stack Express & Vite Server Entry Point
 * Phase 4 Production & Development Server
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Check if TSX execution loader is already loaded
const hasTsx = Boolean(
  process.env.__TSX_ACTIVE === 'true' ||
  process.execArgv.some((arg) => arg.includes('tsx'))
);

if (!hasTsx) {
  // Re-exec using node --import tsx to cleanly execute TypeScript ESM without loader issues
  const currentFile = fileURLToPath(import.meta.url);
  const child = spawn(
    process.execPath,
    ['--import', 'tsx', currentFile, ...process.argv.slice(2)],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        __TSX_ACTIVE: 'true',
      },
    }
  );

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    }
    process.exit(code ?? 0);
  });
} else {
  // TSX loader active: import and start server runner
  const { runServer } = await import('./server/serverRunner');
  runServer().catch((err: unknown) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
