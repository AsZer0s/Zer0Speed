import { readFileSync, writeFileSync, existsSync } from 'fs';
import { userMap } from './userList.js';  // 导入userMap来检查卡密状态

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

            // 清理旧的绑定Map
            this.bindMap.clear();
            
            // 检查并只加载有效的卡密绑定
            for (let i = 1; i < lines.length - 1; i++) {
                const line = lines[i].trim();
                if (line && !line.startsWith('#')) {
                    const [cdk, username] = line.split(':').map(s => s.trim());
                    if (cdk && username) {
                        // 只有当卡密存在且未过期时才保留绑定
                        if (userMap.has(cdk) && userMap.get(cdk) > 0) {
                            this.bindMap.set(cdk, username);
                        } else {
                            console.log(`[x]删除过期卡密绑定: ${cdk} -> ${username}`);
                        }
                    }
                }
            }
            
            // 保存清理后的绑定关系
            this.saveBinds();
            console.log(`[+]成功加载${this.bindMap.size}个有效卡密绑定`);
        } catch (error) {
            console.error('[!]加载卡密绑定失败:', error);
        }
    }

    saveBinds() {
        try {
            let content = 'HoweCraft User Bind\n';
            
            // 再次检查并只保存有效的绑定
            for (const [cdk, username] of this.bindMap) {
                if (userMap.has(cdk) && userMap.get(cdk) > 0) {
                    content += `${cdk}:${username}\n`;
                } else {
                    console.log(`[x]移除无效卡密绑定: ${cdk} -> ${username}`);
                    this.bindMap.delete(cdk);  // 从内存中也删除
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
        // 检查卡密是否有效
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

    // 检查并清理过期绑定
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
        // 检查绑定前先验证卡密是否有效
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
        // 如果卡密无效，返回null
        if (!userMap.has(cdk) || userMap.get(cdk) <= 0) {
            return null;
        }
        return this.bindMap.get(cdk);
    }

    checkBinding(cdk, username) {
        // 如果卡密无效，直接返回false
        if (!userMap.has(cdk) || userMap.get(cdk) <= 0) {
            return false;
        }
        const boundUser = this.bindMap.get(cdk);
        return boundUser === username;
    }
}

export const userBind = new UserBindManager(); 