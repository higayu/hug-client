const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

function normalizePath(path) {
  const parts = [];

  String(path || "")
    .replace(/\\/g, "/")
    .split("/")
    .forEach((part) => {
      if (!part || part === ".") return;
      if (part === "..") {
        parts.pop();
        return;
      }
      parts.push(part);
    });

  return parts.join("/");
}

function dirname(path) {
  const normalized = normalizePath(path);
  const index = normalized.lastIndexOf("/");
  return index === -1 ? "" : normalized.slice(0, index);
}

function hasExtension(path) {
  return /\.[^/]+$/.test(path);
}

function buildCandidates(fromFile, request) {
  const baseDir = dirname(fromFile);
  const requested = String(request || "").trim();

  if (!requested) {
    return [];
  }

  if (!requested.startsWith(".")) {
    return [normalizePath(requested)];
  }

  const base = normalizePath(`${baseDir}/${requested}`);

  if (hasExtension(base)) {
    return [base];
  }

  return [
    base,
    `${base}.js`,
    `${base}.json`,
    `${base}/index.js`,
    `${base}/index.json`,
  ];
}

function createFileMap(files = []) {
  const map = new Map();

  for (const file of files) {
    if (!file?.file_path) continue;
    if (file.is_active === 0 || file.is_active === false) continue;

    map.set(normalizePath(file.file_path), {
      ...file,
      file_path: normalizePath(file.file_path),
    });
  }

  return map;
}

/**
 * DBから取得した複数ファイルを、メモリ上のCommonJS仮想モジュールとして実行する。
 *
 * DB側のJSは以下の形式を使用する。
 *
 *   const { fetchSomething } = require("./fetch");
 *   module.exports = async function execute({ input, helpers }) { ... };
 *
 * または:
 *
 *   exports.fetchSomething = async function (...) { ... };
 *
 * 物理ファイルは生成しない。
 */
export function createVirtualModuleLoader({
  files = [],
  globals = {},
} = {}) {
  const fileMap = createFileMap(files);
  const moduleCache = new Map();

  const resolveFile = (fromFile, request) => {
    const candidates = buildCandidates(fromFile, request);

    for (const candidate of candidates) {
      if (fileMap.has(candidate)) {
        return candidate;
      }
    }

    throw new Error(
      `[WebAutomationV2] 仮想モジュールが見つかりません: ` +
        `${request} (from: ${fromFile})`
    );
  };

  const loadModule = async (filePath) => {
    const normalized = normalizePath(filePath);

    if (moduleCache.has(normalized)) {
      return moduleCache.get(normalized).exports;
    }

    const file = fileMap.get(normalized);

    if (!file) {
      throw new Error(
        `[WebAutomationV2] ファイルが見つかりません: ${normalized}`
      );
    }

    const module = { exports: {} };
    moduleCache.set(normalized, module);

    if (file.file_type === "json" || normalized.endsWith(".json")) {
      try {
        module.exports = JSON.parse(file.source_text || "null");
        return module.exports;
      } catch (error) {
        moduleCache.delete(normalized);
        throw new Error(
          `[WebAutomationV2] JSON解析失敗: ${normalized}: ${error.message}`
        );
      }
    }

    const localRequire = async (request) => {
      // Electron/Vite側の任意importは許可しない。
      // DB Flow内部の相対仮想モジュールのみ解決する。
      if (!String(request || "").startsWith(".")) {
        throw new Error(
          `[WebAutomationV2] 外部requireは禁止されています: ${request}`
        );
      }

      const resolved = resolveFile(normalized, request);
      return loadModule(resolved);
    };

    const source = String(file.source_text || "");

    try {
      const runner = new AsyncFunction(
        "require",
        "module",
        "exports",
        "__filename",
        "__dirname",
        "globals",
        `"use strict";\n${source}\n//# sourceURL=web-automation-v2://${normalized}`
      );

      await runner(
        localRequire,
        module,
        module.exports,
        normalized,
        dirname(normalized),
        Object.freeze({ ...globals })
      );

      return module.exports;
    } catch (error) {
      moduleCache.delete(normalized);
      throw new Error(
        `[WebAutomationV2] モジュール実行失敗: ${normalized}: ${error.message}`
      );
    }
  };

  return {
    files: fileMap,
    resolveFile,
    loadModule,
    clearCache() {
      moduleCache.clear();
    },
  };
}

export async function executeVirtualEntry({
  files,
  entryFile = "index.js",
  entryExport = "default",
  args = {},
  globals = {},
}) {
  const loader = createVirtualModuleLoader({ files, globals });
  const entryModule = await loader.loadModule(entryFile);

  let entryFunction;

  if (entryExport === "default") {
    entryFunction =
      typeof entryModule === "function"
        ? entryModule
        : entryModule?.default;
  } else {
    entryFunction = entryModule?.[entryExport];
  }

  if (typeof entryFunction !== "function") {
    throw new Error(
      `[WebAutomationV2] entry exportが関数ではありません: ` +
        `${entryFile}#${entryExport}`
    );
  }

  return entryFunction(args);
}
