/// <reference types="vitest/config" />

import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    // Workaround for Prisma v7 WASM loading issue with Vite
    // See: https://github.com/prisma/prisma/issues/28105
    {
      enforce: "pre",
      name: "prisma-wasm-strip-module",
      resolveId(id, importer) {
        if (id.endsWith(".wasm?module")) {
          return this.resolve(id.replace("?module", ""), importer, {
            skipSelf: true,
          });
        }
      },
    },
    wasm(),
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tanstackStart(),
    nitro({
      rollupConfig: {
        external: [/^@prisma\//, /\.wasm$/, /bcryptjs/],
      },
    }),
    // react's vite plugin must come after start's vite plugin
    viteReact({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
  ],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./test/setup-test-env.ts"],
  },
});
