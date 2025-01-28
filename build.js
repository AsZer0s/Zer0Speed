import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import obfuscator from 'javascript-obfuscator';

esbuild.build({
    entryPoints: ['./src/main.js'],
    bundle: true,
    platform: 'node',
    outfile: 'dist/main.cjs',
    format: 'cjs',
    minify: true,
    sourcemap: false,
    external: ['sleep'],
}).then(() => {
    const code = fs.readFileSync('dist/main.cjs', 'utf8');
    
    const obfuscatedCode = obfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        deadCodeInjection: true,
        debugProtection: true,
        debugProtectionInterval: true,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        renameGlobals: false,
        rotateStringArray: true,
        selfDefending: true,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayThreshold: 0.75,
        transformObjectKeys: true,
        unicodeEscapeSequence: false
    }).getObfuscatedCode();

    fs.writeFileSync('dist/main.cjs', obfuscatedCode, 'utf8');

    const publicDir = path.join(path.resolve(), './public');
    const distDir = path.join(path.resolve(), 'dist', 'public');

    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }

    fs.readdirSync(publicDir).forEach(file => {
        const srcPath = path.join(publicDir, file);
        const destPath = path.join(distDir, file);
        fs.copyFileSync(srcPath, destPath);
    });

    console.log('静态文件已复制到 dist/public');
}).catch(() => process.exit(1)); 