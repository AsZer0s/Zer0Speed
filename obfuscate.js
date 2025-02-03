import fs from 'fs';
import JavaScriptObfuscator from 'javascript-obfuscator';

const inputPath = 'public/scripts.js';
const outputPath = 'public/scripts.obfuscated.js';

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
