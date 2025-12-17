import adapter from "@sveltejs/adapter-static"
import {vitePreprocess} from "@sveltejs/vite-plugin-svelte"

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      fallback: "index.html",
      pages: "build",
      assets: "build"
    }),
    prerender: {
      entries: ['/']
    },
    paths: {
      base: process.env.BASE_PATH ? '/' + process.env.BASE_PATH : ''
    }
  }
}

export default config
