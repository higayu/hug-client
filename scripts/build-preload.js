const esbuild = require('esbuild');
const path = require('path');

const isDev = process.argv.includes('--dev');

async function buildPreload() {
  try {
    await esbuild.build({
      entryPoints: [path.resolve(__dirname, '../electron/preload/index.js')],
      outfile: path.resolve(__dirname, '../electron/preload/preload.bundle.cjs'),
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      sourcemap: isDev,
      external: ['electron'],
      logLevel: 'info',
    });

    void 0;
  } catch (error) {
    console.error('Failed to build preload script');
    console.error(error);
    process.exit(1);
  }
}

buildPreload();
