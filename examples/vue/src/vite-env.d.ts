/// <reference types="vite/client" />

// Vue 单文件组件类型声明
declare module "*.vue" {
    import type { DefineComponent } from "vue";
    const component: DefineComponent<object, object, unknown>;
    export default component;
}

// 静态资源类型声明
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.svg";
declare module "*.webp";

// CSS Modules 类型声明
declare module "*.module.css" {
    const classes: { [key: string]: string };
    export default classes;
}

declare module "*.module.scss" {
    const classes: { [key: string]: string };
    export default classes;
}

declare module "*.module.less" {
    const classes: { [key: string]: string };
    export default classes;
}
