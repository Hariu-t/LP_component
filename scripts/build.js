const { spawnSync } = require('node:child_process');

const nextBin = require.resolve('next/dist/bin/next');

const env = {
  ...process.env,
  NODE_ENV: 'production',
};

const result = spawnSync(process.execPath, [nextBin, 'build'], {
  stdio: 'inherit',
  env,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
