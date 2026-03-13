import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import type { StorybookConfig } from "@storybook/react-vite"
import tailwindcss from "@tailwindcss/vite"

const currentDir = dirname(fileURLToPath(import.meta.url))

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
    config.plugins ??= []
    config.plugins.push(tailwindcss())

    config.resolve ??= {}
    const previousAlias = config.resolve.alias ?? {}

    config.resolve.alias = {
      ...(typeof previousAlias === "object" ? previousAlias : {}),
      "@": resolve(currentDir, "../../../src/renderer/src"),
      "@renderer": resolve(currentDir, "../../../src/renderer/src"),
    }

    return config
  },
}

export default config
