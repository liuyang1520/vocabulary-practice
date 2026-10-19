import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/vocabulary-practice/',
  plugins: [react(), tailwindcss()],
  build: {
    license: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vocabulary-core',
              test: /src\/data\/japanese\.json$/,
              includeDependenciesRecursively: false,
            },
            {
              name: 'memory-lexicon',
              test: /src\/data\/memory-lexicon\.json$/,
              includeDependenciesRecursively: false,
            },
            {
              name: 'illustrations-index',
              test: /src\/data\/illustrations\.json$/,
              includeDependenciesRecursively: false,
            },
            {
              name: 'vocabulary-extended',
              test: /src\/data\/japanese-extended\.json$/,
              includeDependenciesRecursively: false,
            },
          ],
        },
      },
    },
  },
});
