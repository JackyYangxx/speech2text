import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'speech2text-web': resolve(__dirname, '../../dist/speech2text.esm.js')
    }
  }
})
