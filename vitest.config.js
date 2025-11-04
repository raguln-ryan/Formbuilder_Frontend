import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      all: true,
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'node_modules/',
        'src/setupTests.js',
        'src/main.jsx',
        'src/App.jsx',
        '**/*.test.{js,jsx}',
        '**/__tests__/**'
      ],
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components')
    }
  }
})