import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Increase the warning limit to avoid unnecessary warnings
    chunkSizeWarningLimit: 800,
    
    // Configure Rollup options for better code splitting
    rollupOptions: {
      output: {
        // Configure manual chunks to better organize code
        manualChunks: {
          // Group React and related libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // Group styling libraries
          'vendor-ui': ['styled-components'],
          
          // Group database and storage related code
          'db-utils': [
            '@supabase/supabase-js',
            './src/lib/db/client.ts',
            './src/lib/db/utils.ts'
          ],
          
          // Group admin components
          'admin-components': [
            './src/components/AdminLayout.tsx',
            './src/components/AdminSidebar.tsx'
          ]
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
