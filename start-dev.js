const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT = __dirname;
const NODE_BIN = process.execPath;
const ELECTRON_EXE = path.join(ROOT, 'node_modules', 'electron', 'dist', 'electron.exe');
const VITE_CONFIG = path.join(ROOT, 'vite.renderer.config.ts');
const ESBUILD_BIN = path.join(ROOT, 'node_modules', 'esbuild', 'bin', 'esbuild');
const VITE_BIN = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');

// Clear ELECTRON_RUN_AS_NODE (must delete, not just set to empty string)
delete process.env.ELECTRON_RUN_AS_NODE;

function log(msg) {
  console.log(`[start-dev] ${msg}`);
}

/**
 * 运行一个子进程（node + js 脚本，shell:false 最稳）
 */
function run(bin, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd, stdio: 'inherit', shell: false });
    child.on('error', (err) => reject(err));
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`进程退出码 ${code}`));
    });
  });
}

async function build() {
  log('开始编译主进程 (esbuild -> out/main/index.js)...');
  await run(NODE_BIN, [
    ESBUILD_BIN,
    'electron/main/index.ts',
    '--bundle',
    '--platform=node',
    '--external:electron',
    '--external:electron-*',
    '--outfile=out/main/index.js',
    '--format=cjs',
    '--alias:@shared=./src',
  ], ROOT);

  log('开始编译预加载脚本 (esbuild -> out/preload/index.js)...');
  await run(NODE_BIN, [
    ESBUILD_BIN,
    'electron/preload/index.ts',
    '--bundle',
    '--platform=node',
    '--external:electron',
    '--outfile=out/preload/index.js',
    '--format=cjs',
    '--alias:@shared=./src',
  ], ROOT);
}

function waitForVite(timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      http.get('http://localhost:5173/', (res) => {
        if (res.statusCode === 200) return resolve();
        if (Date.now() - start > timeoutMs) return reject(new Error('Vite 启动超时'));
        setTimeout(check, 500);
      }).on('error', () => {
        if (Date.now() - start > timeoutMs) return reject(new Error('Vite 启动超时'));
        setTimeout(check, 500);
      });
    };
    check();
  });
}

async function main() {
  if (!fs.existsSync(ELECTRON_EXE)) {
    throw new Error(`找不到 Electron 可执行文件: ${ELECTRON_EXE}\n请先执行 npm install 安装依赖。`);
  }

  await build();

  log('启动 Vite 开发服务器...');
  const vite = spawn(NODE_BIN, [VITE_BIN, '--config', VITE_CONFIG], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
  });

  log('等待 Vite 就绪 (http://localhost:5173)...');
  try {
    await waitForVite();
  } catch (e) {
    vite.kill();
    throw new Error(`Vite 启动失败: ${e.message}`);
  }

  log('启动 Electron...');
  process.env.ELECTRON_RENDERER_URL = 'http://localhost:5173';
  const electron = spawn(ELECTRON_EXE, ['.'], { cwd: ROOT, stdio: 'inherit', env: process.env });

  electron.on('error', (err) => {
    console.error('\n[start-dev] Electron 启动出错:', err.message);
    console.error('[start-dev] 请确认 node_modules/electron 已正确安装。');
    vite.kill();
    process.exit(1);
  });

  electron.on('exit', (code) => {
    vite.kill();
    if (code === 0) {
      log('Electron 已正常退出。');
    } else {
      console.error(`\n[start-dev] Electron 进程异常退出 (code=${code})。`);
      console.error('[start-dev] 上方即为崩溃日志。按任意键可关闭窗口。');
    }
    // 保持窗口打开，方便查看错误
    process.stdin.resume();
    process.stdin.on('data', () => process.exit(code === 0 ? 0 : 1));
  });
}

main().catch((e) => {
  console.error('\n[start-dev] 启动失败:', e && e.message ? e.message : e);
  console.error('[start-dev] 按任意键关闭窗口。');
  process.stdin.resume();
  process.stdin.on('data', () => process.exit(1));
});
