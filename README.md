# vite-plugin-qiankun-lite

A simple Vite plugin for efficiently running MicroFrontend applications using [qiankun](https://github.com/umijs/qiankun).

## 📢 关于此 Fork / About This Fork

本项目 fork 自 [kotarella1110/vite-plugin-qiankun-lite](https://github.com/kotarella1110/vite-plugin-qiankun-lite)。原项目是一个优秀的 Vite + qiankun 集成方案，但目前似乎已停止维护。

This project is forked from [kotarella1110/vite-plugin-qiankun-lite](https://github.com/kotarella1110/vite-plugin-qiankun-lite). While the original project provided an excellent integration solution for Vite and qiankun, it appears to be no longer actively maintained.

### Purpose

- **🔧 Bug Fixes**: Fix compatibility issues with other Vite plugins (e.g., vite-plugin-checker)
- **🚀 Continuous Maintenance**: Keep compatibility with the latest versions of Vite and qiankun
- **📦 Feature Enhancement**: Add new features and improvements based on community feedback
- **📝 Documentation**: Provide more detailed documentation and use cases

### Acknowledgments

Special thanks to [@kotarella1110](https://github.com/kotarella1110) for creating this excellent project and providing an elegant solution for Vite and qiankun integration. This fork aims to continue improving and maintaining the project based on the original foundation.

## Features

- Offers the simplest method for integrating qiankun with Vite.
- Preserves Vite's benefits in constructing ES modules.
- Allows for one-click configuration without disrupting existing Vite setups.
- Includes a comprehensive JS Sandbox whenever feasible (experimental).
- Supports React's HMR (Hot Module Replacement).

## Installation

```bash
npm i @hansonfang/vite-plugin-qiankun-lite -D
```

## Getting Started

You can start working with just a few simple steps. Add the qiankun plugin to your sub application's Vite configuration like so:

```javascript
// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import qiankun from "vite-plugin-qiankun-lite";

export default defineConfig({
  plugins: [react(), qiankun({ name: "sub-app", sandbox: true })],
});
```

## Comparison with vite-plugin-qiankun

This plugin is primarily inspired by [vite-plugin-qiankun](https://github.com/tengmaoqing/vite-plugin-qiankun) but differs in the following ways:

- You can get started with just adding the plugin.
- This means you don't need to use functions like `exportLifeCycleHooks` to export qiankun's lifecycle or constants like `qiankunWindow` to access the proxy window provided by qiankun.
- Offers a comprehensive JS Sandbox wherever possible.

## Inspiration

In the development of this plugin, I drew significant inspiration from the following projects and communities. I express my heartfelt gratitude.

- [vite-plugin-qiankun](https://github.com/tengmaoqing/vite-plugin-qiankun)
- [@sh-winter/vite-plugin-qiankun](https://github.com/sh-winter/vite-plugin-qiankun)
- [vite-plugin-legacy-qiankun](https://github.com/lishaobos/vite-plugin-legacy-qiankun)
