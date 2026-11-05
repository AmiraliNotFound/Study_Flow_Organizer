/**
 * Study Flow Organizer - Standalone Executable Builder
 *
 * 1. Bundles runtime and static assets with caxa
 * 2. Patches the PE header from Console (3) to Windows GUI (2)
 *    to eliminate the black terminal window completely.
 */

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const OUTPUT_EXE = path.join(DIST_DIR, 'Study_Flow_Organizer.exe');

console.log('==> [1/3] Preparing output directory...');
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
}

console.log('==> [2/3] Bundling standalone binary with caxa...');
const caxaCmd = `npx caxa --input . --output dist/Study_Flow_Organizer.exe --exclude "dist" ".git" "src-tauri" -- "{{caxa}}/node_modules/.bin/node" "{{caxa}}/desktop/launcher.js"`;
execSync(caxaCmd, { cwd: ROOT_DIR, stdio: 'inherit' });

console.log('==> [3/3] Patching PE Header to native Windows GUI subsystem...');
if (fs.existsSync(OUTPUT_EXE)) {
    const buf = fs.readFileSync(OUTPUT_EXE);
    const peOffset = buf.readUInt32LE(0x3C);
    const subsystemOffset = peOffset + 24 + 68;
    const currentSubsystem = buf.readUInt16LE(subsystemOffset);

    if (currentSubsystem === 3) {
        buf.writeUInt16LE(2, subsystemOffset); // 2 = IMAGE_SUBSYSTEM_WINDOWS_GUI
        fs.writeFileSync(OUTPUT_EXE, buf);
        console.log(`    Successfully patched Subsystem from 3 (Console) to 2 (Windows GUI).`);
    } else {
        console.log(`    Subsystem is already ${currentSubsystem}.`);
    }

    const stats = fs.statSync(OUTPUT_EXE);
    console.log(`\n🎉 Build complete!`);
    console.log(`    Output: ${OUTPUT_EXE}`);
    console.log(`    Size  : ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
} else {
    console.error('Build output not found at', OUTPUT_EXE);
    process.exit(1);
}
