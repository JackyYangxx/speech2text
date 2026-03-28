import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/speech2text.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    {
      file: 'dist/speech2text.esm.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  external: ['react', 'react-dom', 'vue'],
  plugins: [
    resolve({
      browser: true
    }),
    commonjs({
      include: /node_modules/
    }),
    typescript({
      declaration: true,
      declarationDir: 'dist',
      outputToFilesystem: true
    }),
    postcss({
      extract: 'speech2text.css',
      minimize: true
    })
  ]
};
