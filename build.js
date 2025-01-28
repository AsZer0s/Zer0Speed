import esbuild from 'esbuild';
import fs from 'fs';
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
    console.log('代码已混淆并保存到 dist/main.cjs');
}).catch(() => process.exit(1)); 