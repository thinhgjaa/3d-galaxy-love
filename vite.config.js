import { defineConfig } from 'vite';

export default defineConfig({
  server: {
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
