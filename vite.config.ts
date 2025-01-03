import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the
  // `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  const BASEURL = process.env.VITE_BASEURL;

  return {
    // vite config
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
    base: env.VITE_BASEURL || BASEURL || `http://127.0.0.1:5500/dist/`,
    plugins: [react()],
  };
});
