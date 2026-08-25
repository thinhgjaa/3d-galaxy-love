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
  }
});
