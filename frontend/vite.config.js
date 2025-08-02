import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))


export default defineConfig({

   base: '/~Jm224an/todo-app',

  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        posts: resolve(__dirname, 'posts.html'),
        login: resolve(__dirname, 'login.html'),
      },
    },
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost/backend-ToDo/', 
        changeOrigin: true
      },
      '/auth': {
        target: 'http://localhost/backend-ToDo/', 
        changeOrigin: true
      }
    }
  }
});
