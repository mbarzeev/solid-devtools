<a href="https://github.com/thetarnav/solid-devtools/tree/main/packages/main#readme" target="_blank">
  <p>
    <img width="100%" src="https://assets.solidjs.com/banner?type=Devtools&background=tiles&project=Library" alt="Solid Devtools">
  </p>
</a>

# solid-devtools

The main package of Solid Devtools. It contains the following subpackages:

- [Debugger](https://github.com/thetarnav/solid-devtools/tree/main/packages/debugger#readme)
- [Extension Adapter](https://github.com/thetarnav/solid-devtools/tree/main/packages/extension-adapter#readme) _(this one is automatically enabled)_
- [Locator](https://github.com/thetarnav/solid-devtools/tree/main/packages/locator#readme) — [How to use it](#using-the-locator-package)
- [Babel Plugin](https://github.com/thetarnav/solid-devtools/tree/main/packages/transform#readme) — [How to use it](#enabling-the-babel-plugin)

## Getting started

### Installation

```bash
npm i solid-devtools
# or
yarn add solid-devtools
# or
pnpm add solid-devtools
```

### Using the locator package

The `solid-devtools` package comes with the [Locator](https://github.com/thetarnav/solid-devtools/tree/main/packages/locator#readme) package included.

[**Follow this guide of the locator package**](https://github.com/thetarnav/solid-devtools/tree/main/packages/locator#Getting-Started)

### Enabling the Babel plugin

`solid-devtools` reexports the [babel plugin](https://github.com/thetarnav/solid-devtools/tree/main/packages/transform#readme) as a vite plugin.

```**Note**
In some cases import from `solid-devtools/vite` causes errors in loading vite config. I haven't figured out the cause yet. But to avoid the error, you can import from `@solid-devtools/transform` instead.
```

To enable it you need to add it to plugins array in your `.vite.config.js` file:

```ts
// vite.config.ts

import { defineConfig } from "vite"
import solidPlugin from "vite-plugin-solid"
import devtoolsPlugin from "solid-devtools/vite"
// or: import devtoolsPlugin from "@solid-devtools/transform"

export default defineConfig({
  plugins: [devtoolsPlugin(), solidPlugin()],
})
```

[**See transform options**](https://github.com/thetarnav/solid-devtools/tree/main/packages/transform#Options)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
