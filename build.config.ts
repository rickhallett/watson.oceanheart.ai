// Watson Build Configuration for Production
// Optimized Bun build settings for clinical review application

export default {
  // Build targets and entry points
  entryPoints: ['./frontend/src/main.tsx'],
  outdir: './dist/static',
  
  // Optimization settings
  minify: true,
  splitting: true,
  format: 'esm' as const,
  target: 'browser',
  
  // Static asset configuration
  publicPath: '/static/',
  
  // Advanced optimization
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.API_URL': 'process.env.API_URL || "http://localhost:8000"',
  },
  
  // Bundle splitting for better caching
  external: [],
  
  // Source maps for production debugging
  sourcemap: 'linked',
  
  // Asset handling
  loader: {
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.svg': 'file',
    '.woff': 'file',
    '.woff2': 'file',
    '.ttf': 'file',
    '.eot': 'file',
  },
  
  // Build metadata
  metafile: true,
  
  // Production-specific settings
  treeshaking: true,
  mangling: true,
  
  // Output naming for caching
  naming: {
    entry: '[name]-[hash].js',
    chunk: 'chunks/[name]-[hash].js',
    asset: 'assets/[name]-[hash].[ext]',
  },
} as const;