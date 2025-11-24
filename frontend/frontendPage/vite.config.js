import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: 'swiper/react', replacement: path.resolve(__dirname, 'src/shims/swiper-react.js') },
      { find: 'swiper/css', replacement: path.resolve(__dirname, 'src/shims/swiper-empty.css') },
      { find: 'swiper/css/autoplay', replacement: path.resolve(__dirname, 'src/shims/swiper-empty.css') }
      ,{ find: 'react-icons/fi', replacement: path.resolve(__dirname, 'src/shims/react-icons-fi.jsx') }
    ]
  }
})
