'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { exec } = require('child_process');
const yazl = require('yazl');

/* =========================
 * 配置区
 * ========================= */

const SYSTEM_TAG = process.argv[2] || 'default';

// profiles 配置
let PROFILES = [
    { path: 'C:\\Users\\kaikai\\scoop\\persist\\firefox\\profile', archive: 'firefox-profile-kaikaishowup' },
]

if (SYSTEM_TAG === 'win10') PROFILES = [
    { path: 'C:\\Users\\kaikai\\scoop\\persist\\firefox\\profile', archive: 'firefox-profile-yourkaikai' },
];

// 统一备份目录（网盘目录）
const ARCHIVES_DIR = 'F:\\OneDrive\\Cartulary\\profiles-backup';

// 跳过的目录（相对 profile 根目录的第一层）
const SKIP_DIRS = new Set([
    'cache2',
    'startupCache',
    'safebrowsing',
    'shader-cache',
    'crashes',
    'saved-telemetry-pings'
]);

/* =========================
 * 工具函数
 * ========================= */

function formatTime(d = new Date()) {
    const pad = n => String(n).padStart(2, '0');
    return (
        d.getFullYear() +
        pad(d.getMonth() + 1) +
        pad(d.getDate()) +
        pad(d.getHours()) +
        pad(d.getMinutes()) +
        pad(d.getSeconds())
    );
}


function checkFirefoxRunning() {
    return new Promise(resolve => {
        exec('tasklist', { windowsHide: true }, (err, stdout) => {
            if (err) {
                // 出错时保守起见，认为 Firefox 在运行
                resolve(true);
                return;
            }
            resolve(stdout.toLowerCase().includes('firefox.exe'));
        });
    });
}

async function scanProfileFiles(profileRoot) {
    const files = [];

    async function walk(dir) {
        const entries = await fsp.readdir(dir, { withFileTypes: true });

        for (const ent of entries) {
            const fullPath = path.join(dir, ent.name);
            const relPath = path.relative(profileRoot, fullPath);

            // 第一层目录跳过
            const topLevel = relPath.split(path.sep)[0];
            if (SKIP_DIRS.has(topLevel)) continue;

            if (ent.isDirectory()) {
                await walk(fullPath);
            } else if (ent.isFile()) {
                files.push({ abs: fullPath, rel: relPath });
            }
        }
    }

    await walk(profileRoot);
    return files;
}

async function backupSingleProfile(profile) {
    console.log(`\n[+] 开始备份: ${profile.archive}`);

    const time = formatTime();
    const zipName = `${profile.archive}-${time}.zip`;
    const zipPath = path.join(ARCHIVES_DIR, zipName);

    // 扫描文件
    const files = await scanProfileFiles(profile.path);
    console.log(`    文件数: ${files.length}`);

    // 创建 zip
    const zip = new yazl.ZipFile();

    for (const file of files) {
        try {
            await fsp.access(file.abs, fs.constants.R_OK);
            zip.addFile(file.abs, file.rel, { compressionLevel: 1 });
        } catch (err) {
            if (err.code !== 'ENOENT') {
                console.warn(`    [skip] ${file.rel} (${err.code})`);
            }
        }
    }

    await new Promise((resolve, reject) => {
        zip.outputStream
            .pipe(fs.createWriteStream(zipPath))
            .on('close', resolve)
            .on('error', reject);

        zip.end();
    });

    console.log(`    完成: ${zipName}`);
}

async function backupAllProfiles() {
    for (const profile of PROFILES) {
        await backupSingleProfile(profile);
    }
}

async function main() {
    console.log('[*] Firefox profile backup started');

    const firefoxRunning = await checkFirefoxRunning();
    if (firefoxRunning) {
        console.log('[!] Firefox 正在运行，退出备份');
        return;
    }

    await backupAllProfiles();

    console.log('[*] 所有 profile 备份完成');
}

main().catch(err => {
    console.error('[ERROR]', err);
    process.exit(1);
});
