import { readFileSync, writeFileSync, existsSync } from 'fs';
import { userMap } from './userList.js';

class UserBindManager {
    constructor() {
        this.bindPath = './bind.txt';
        this.bindMap = new Map();
        this.loadBinds();
    }

    loadBinds() {
        try {
            if (!existsSync(this.bindPath)) {
                this.saveBinds();
                return;
            }

            const content = readFileSync(this.bindPath, 'utf8');
            const lines = content.split('\n');
            
            if (!lines[0].trim().startsWith('HoweCraft User Bind') || 
                !lines[lines.length - 1].trim().startsWith('HoweCraft User Bind End')) {
                console.log('[!]卡密绑定文件格式错误');
                return;
            }

            this.bindMap.clear();
            for (let i = 1; i < lines.length - 1; i++) {
                const line = lines[i].trim();
                if (line && !line.startsWith('#')) {
                    const [cdk, username] = line.split(':').map(s => s.trim());
                    if (cdk && username) {
                        if (userMap.has(cdk) && userMap.get(cdk) > 0) {
                            this.bindMap.set(cdk, username);
                        } else {
                            console.log(`[x]删除过期卡密绑定: ${cdk} -> ${username}`);
                        }
                    }
                }
            }
            
            this.saveBinds();
            console.log(`[+]成功加载${this.bindMap.size}个有效卡密绑定`);
        } catch (error) {
            console.error('[!]加载卡密绑定失败:', error);
        }
    }

    saveBinds() {
        try {
            let content = 'HoweCraft User Bind\n';
            
            for (const [cdk, username] of this.bindMap) {
                if (userMap.has(cdk) && userMap.get(cdk) > 0) {
                    content += `${cdk}:${username}\n`;
                } else {
                    console.log(`[x]移除无效卡密绑定: ${cdk} -> ${username}`);
                    this.bindMap.delete(cdk);
                }
            }
            
            content += 'HoweCraft User Bind End';
            writeFileSync(this.bindPath, content, 'utf8');
            console.log('[+]已保存卡密绑定');
        } catch (error) {
            console.error('[!]保存卡密绑定失败:', error);
        }
    }

    bind(cdk, username) {
        if (!userMap.has(cdk) || userMap.get(cdk) <= 0) {
            console.log(`[!]无法绑定无效卡密: ${cdk}`);
            return false;
        }

        if (!this.isBound(cdk)) {
            this.bindMap.set(cdk, username);
            
            try {
                const content = readFileSync(this.bindPath, 'utf8');
                const lines = content.split('\n');
                
                lines.pop();
                lines.push(`${cdk}:${username}`);
                lines.push('HoweCraft User Bind End');
                
                writeFileSync(this.bindPath, lines.join('\n'), 'utf8');
                
                console.log(`[+]卡密 ${cdk} 成功绑定玩家 ${username}`);
                return true;
            } catch (error) {
                console.error('[!]出现问题: ', error);
                return false;
            }
        } else {
            console.log(`[!]卡密 ${cdk} 已绑定玩家 ${this.getBoundUser(cdk)}`);
            return false;
        }
    }

    cleanupExpiredBinds() {
        let cleaned = 0;
        for (const [cdk, username] of this.bindMap) {
            if (!userMap.has(cdk) || userMap.get(cdk) <= 0) {
                this.bindMap.delete(cdk);
                cleaned++;
                console.log(`[x]清理过期卡密绑定: ${cdk} -> ${username}`);
            }
        }
        if (cleaned > 0) {
            this.saveBinds();
            console.log(`[+]已清理 ${cleaned} 个过期卡密绑定`);
        }
    }

    isBound(cdk) {
        if (!userMap.has(cdk) || userMap.get(cdk) <= 0) {
            if (this.bindMap.has(cdk)) {
                console.log(`[x]删除过期卡密绑定: ${cdk}`);
                this.bindMap.delete(cdk);
                this.saveBinds();
            }
            return false;
        }
        return this.bindMap.has(cdk);
    }

    getBoundUser(cdk) {
        if (!userMap.has(cdk) || userMap.get(cdk) <= 0) {
            return null;
        }
        return this.bindMap.get(cdk);
    }

    checkBinding(cdk, username) {
        if (!userMap.has(cdk) || userMap.get(cdk) <= 0) {
            return false;
        }
        const boundUser = this.bindMap.get(cdk);
        return boundUser === username;
    }
}

export const userBind = new UserBindManager(); 