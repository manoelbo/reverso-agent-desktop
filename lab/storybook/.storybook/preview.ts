import type { Preview } from "@storybook/react-vite"
import "../../../src/renderer/src/assets/main.css"

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "oklch(1 0 0)" },
        { name: "dark", value: "oklch(0.147 0.004 49.25)" },
      ],
    },
  },
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Tema global das stories",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const root = document.documentElement
      root.classList.remove("dark", "light")
      root.classList.add(context.globals.theme === "dark" ? "dark" : "light")

      return Story()
    },
  ],
}

export default preview
