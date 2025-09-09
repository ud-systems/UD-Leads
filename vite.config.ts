import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
          // React Query for data fetching
          'react-query': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          // Supabase client
          'supabase': ['@supabase/supabase-js'],
          // UI component libraries
          'radix-ui': [
            '@radix-ui/react-dialog', 
            '@radix-ui/react-select', 
            '@radix-ui/react-tabs',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-toast',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip'
          ],
          // Chart libraries
          'charts': ['recharts', '@nivo/bar', '@nivo/core', '@nivo/heatmap', '@nivo/line', '@nivo/pie', '@nivo/radar'],
          // Map libraries
          'maps': ['leaflet', 'leaflet.heat', 'leaflet.markercluster', 'react-leaflet'],
          // Form libraries
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Date utilities
          'date-utils': ['date-fns', 'react-day-picker'],
          // Other utilities
          'utils': ['clsx', 'tailwind-merge', 'class-variance-authority', 'cmdk', 'sonner', 'vaul', 'input-otp', 'embla-carousel-react', 'react-resizable-panels', 'next-themes']
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    // Ensure proper MIME types for built assets
    assetsInlineLimit: 0,
    // Enable source maps for better debugging
    sourcemap: false,
    // Optimize for production (using esbuild minifier)
    minify: 'esbuild',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
  },
  // Ensure proper base path for deployment
  base: '/',
})
