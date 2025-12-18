import { transformAsync } from "@babel/core";
import { type Cheerio, type Element, load } from "cheerio";
import type { PluginOption, ResolvedConfig } from "vite";
import plugin from "./babel-plugin-transform-global-variables";

type Options = {
    name: string;
    sandbox?: boolean;
};

export default function viteQiankun(opts: Options): PluginOption {
    let config: ResolvedConfig;
    const qiankunWindow = `__QIANKUN_WINDOW__["${opts.name}"]`;
    let publicPath = `(${qiankunWindow}.__INJECTED_PUBLIC_PATH_BY_QIANKUN__ || "")`;
    return [
        {
            name: "qiankun:remain-exports",
            enforce: "post",
            apply: "build",
            options(options) {
                return {
                    ...options,
                    preserveEntrySignatures: "strict",
                };
            },
            transform(code, id) {
                if (id.endsWith("html") && this.getModuleInfo(id)?.isEntry) {
                    return code.replace(/import\s+(['"])([^'"]+\.(m?js|[jt]sx?))\1/g, "export * from $1$2$1");
                }
                return null;
            },
        },
        {
            name: "qiankun:vite-module-script-transform",
            enforce: "post",
            apply: "serve",
            configureServer(server) {
                return () => {
                    server.middlewares.use((_, res, next) => {
                        if (config.isProduction) return next();

                        const end = res.end.bind(res);
                        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                        res.end = (...args: any[]) => {
                            let [htmlStr, ...rest] = args;
                            if (typeof htmlStr === "string") {
                                const $ = load(htmlStr);
                                moduleScriptToGeneralScript(
                                    $($(`script[src=${config.base}@vite/client]`).get(0)),
                                    publicPath
                                );
                                const moduleScripts$ = $("script:not([src])[type=module]");
                                moduleScripts$.each((_, moduleScript) => {
                                    const moduleScript$ = $(moduleScript);
                                    const scriptContent = moduleScript$.text();
                                    if (scriptContent.includes(`${config.base}@react-refresh`)) {
                                        // 特殊处理 react-refresh，需要注入到 global hook
                                        reactRefreshModuleScriptToGeneralScript(
                                            moduleScript$,
                                            `${publicPath} + "${config.base}@react-refresh"`
                                        );
                                    } else {
                                        // 通用处理其他内联模块脚本（如 vite-plugin-checker 等）
                                        inlineModuleScriptToGeneralScript(moduleScript$, publicPath);
                                    }
                                });
                                htmlStr = $.html();
                            }
                            return end(htmlStr, ...rest);
                        };
                        next();
                    });
                };
            },
        },
        {
            name: "qiankun:support-sandbox",
            enforce: "post",
            async transform(code, id) {
                const [filepath] = id.split("?");
                const jsExts = [/\.[jt]sx?$/, /\.(c|m)?js?$/, /\.vue$/, /\.svelte$/];
                if (!jsExts.some((reg) => reg.test(filepath))) return;

                const baseTransformOptions = {
                    root: process.cwd(),
                    filename: id,
                    sourceFileName: filepath,
                    sourceMaps: true,
                };

                if (!opts.sandbox) {
                    const qiankunGlobalVariables = [
                        "window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__",
                        "window.__POWERED_BY_QIANKUN__",
                    ];
                    if (!qiankunGlobalVariables.some((qiankunGlobalVariable) => code.includes(qiankunGlobalVariable)))
                        return;

                    const result = await transformAsync(code, {
                        ...baseTransformOptions,
                        plugins: [
                            [
                                plugin,
                                {
                                    replace: {
                                        ...qiankunGlobalVariables.reduce((acc, qiankunGlobalVariable) => {
                                            acc[qiankunGlobalVariable] = qiankunGlobalVariable.replace(
                                                "window",
                                                qiankunWindow
                                            );
                                            return acc;
                                        }, {} as Record<string, string>),
                                    },
                                },
                            ],
                        ],
                    });

                    if (result?.code) {
                        return {
                            code: result.code,
                            map: result.map,
                        };
                    }

                    return;
                }

                if (!/(document|window|globalThis|self)/g.test(code)) return;

                const result = await transformAsync(code, {
                    ...baseTransformOptions,
                    plugins: [
                        [
                            plugin,
                            {
                                replace: {
                                    ...Object.keys(config.define ?? []).reduce((acc, key) => {
                                        acc[key] = `${qiankunWindow}.${key}`;
                                        return acc;
                                    }, {} as Record<string, string>),
                                    window: qiankunWindow,
                                },
                                addWindowPrefix: true,
                            },
                        ],
                    ],
                });

                if (result?.code) {
                    return {
                        code: result.code,
                        map: result.map,
                    };
                }
            },
        },
        {
            name: "qiankun:html-transform",
            enforce: "post",
            configResolved(resolvedConfig) {
                config = resolvedConfig;
                if (config.base) {
                    publicPath = `${publicPath}.replace(${new RegExp(`${config.base}$`)}, "")`;
                }
            },
            transformIndexHtml(html: string) {
                const $ = load(html);

                $("head").prepend(`
    <script>
      const nativeGlobal = Function("return this")();
      nativeGlobal.__QIANKUN_WINDOW__ = nativeGlobal.__QIANKUN_WINDOW__ || {};
      nativeGlobal.__QIANKUN_WINDOW__["${opts.name}"] = nativeGlobal.proxy || nativeGlobal;
    </script>
        `);

                const moduleTags = $('body script[src][type=module], head script[src][crossorigin=""]');
                if (!moduleTags || !moduleTags.length) {
                    return;
                }
                moduleTags.each((_, moduleTag) => void moduleScriptToGeneralScript($(moduleTag), publicPath));

                const script$ = moduleTags.last();
                script$?.html(`
      window["${opts.name}"] = {};
      const lifecycleNames = ["bootstrap", "mount", "unmount", "update"];
      ${script$.html()}.then((lifecycleHooks) => {
        lifecycleNames.forEach((lifecycleName) =>
          window["${opts.name}"][lifecycleName].resolve(
            lifecycleHooks[lifecycleName],
          ),
        );
      });
      lifecycleNames.forEach((lifecycleName) => {
        let resolve;
        const promise = new Promise((_resolve) => (resolve = _resolve));
        window["${opts.name}"][lifecycleName] = Object.assign(
          (...args) => promise.then((lifecycleHook) => lifecycleHook(...args)),
          { resolve },
        );
      });
    `);
                return $.html();
            },
        },
    ];
}

function moduleScriptToGeneralScript(script$: Cheerio<Element>, publicPath: string) {
    const scriptSrc = script$.attr("src");
    if (!scriptSrc) return;
    script$.removeAttr("src").removeAttr("type").html(`import(${publicPath} + "${scriptSrc}")`);
    return script$;
}

function reactRefreshModuleScriptToGeneralScript(script$: Cheerio<Element>, reactRefreshImportPath: string) {
    script$.removeAttr("type").html(`
      ((window) => {
        import(${reactRefreshImportPath}).then(({ default: RefreshRuntime }) => {
          RefreshRuntime.injectIntoGlobalHook(window);
          window.$RefreshReg$ = () => {};
          window.$RefreshSig$ = () => (type) => type;
          window.__vite_plugin_react_preamble_installed__ = true;
        });
      })(new Function("return this")());
  `);
    return script$;
}

/**
 * 将内联模块脚本转换为动态 import 形式
 * 使用 __QIANKUN_WINDOW__["app"].__INJECTED_PUBLIC_PATH_BY_QIANKUN__ 获取 base URL
 */
function inlineModuleScriptToGeneralScript(script$: Cheerio<Element>, publicPath: string) {
    const code = script$.text();
    if (!code.trim()) return;

    // 解析所有 import 语句，转换为动态 import
    // 匹配: import { xxx } from "path" 或 import "path"
    const importRegex = /import\s+(?:([\w*{}\s,]+)\s+from\s+)?(['"])([^'"]+)\2\s*;?/g;
    const imports: { full: string; names: string | undefined; path: string }[] = [];
    let restCode = code;

    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(code)) !== null) {
        imports.push({
            full: match[0],
            names: match[1]?.trim(),
            path: match[3],
        });
        restCode = restCode.replace(match[0], "");
    }

    if (imports.length === 0) {
        script$.removeAttr("type");
        return;
    }

    // 生成动态 import 代码
    const dynamicImports = imports
        .map(({ names, path }) => {
            // 移除 */ 前缀，并确保路径以 / 开头
            const normalizedPath = "/" + path.replace(/^\*\//, "");
            if (names) {
                // import { inject } from "path" -> const { inject } = await import(base + "/path")
                return `const ${names} = await import(base + "${normalizedPath}");`;
            }
            // import "path" -> await import(base + "/path")
            return `await import(base + "${normalizedPath}");`;
        })
        .join("\n    ");

    script$.removeAttr("type").html(`
(async function() {
    var base = ${publicPath};
    ${dynamicImports}
    ${restCode.trim()}
})();
`);
}
