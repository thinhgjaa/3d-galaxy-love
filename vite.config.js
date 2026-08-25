import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    allowedHosts: true,
    watch: {
      ignored: [
        '**/*.mp3',
        '**/*.wav',
        '**/*.ogg',
        '**/*.m4a',
        '**/public/audio/**',
        '**/public/photos/**'
      ]
    }
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          orbitcontrols: ['three/examples/jsm/controls/OrbitControls.js'],
          postprocessing: [
            'three/examples/jsm/postprocessing/EffectComposer.js',
            'three/examples/jsm/postprocessing/RenderPass.js',
            'three/examples/jsm/postprocessing/UnrealBloomPass.js'
          ]
        }
      }
    }
  }
});
