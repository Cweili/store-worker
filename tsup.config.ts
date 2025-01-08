import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/worker.ts',
  ],
  outDir: 'dist',
  format: [
    'cjs',
    'esm',
  ],
  dts: true,
  clean: true,
  cjsInterop: true,
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.JEST_WORKER_ID': JSON.stringify(false),
  }
});
