import fs from 'fs';
import path from 'path';
import JavaScriptObfuscator from 'javascript-obfuscator';

const inputPath = 'public/scripts.js';
const outputPath = 'dist/public/scripts.js';

const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const indexHtmlSrc = 'public/index.html';
const indexHtmlDest = 'dist/public/index.html';
fs.copyFileSync(indexHtmlSrc, indexHtmlDest);

const scriptContent = fs.readFileSync(inputPath, 'utf8');

const obfuscatedCode = JavaScriptObfuscator.obfuscate(scriptContent, {
    compact: true,
    controlFlowFlattening: true,
    deadCodeInjection: true,
    debugProtection: true,
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

fs.writeFileSync(outputPath, obfuscatedCode, 'utf8');

console.log('JavaScript 文件已混淆并保存为:', outputPath);
console.log('index.html 已复制到:', indexHtmlDest);
