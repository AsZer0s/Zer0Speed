import { userMap } from './userList.js';
import { userBind } from './UserBind.js';

/**
 * 踢出玩家
 * @param {Object} client - 客户端连接对象
 * @param {string} reason - 踢出原因
 */
export function kickPlayer(client, reason) {
    try {
        client.write(`你已被踢出服务器: ${reason}`);
        client.destroy();
    } catch (error) {
        console.error('踢出玩家时出错:', error);
    }
}

/**
 * 踢出所有卡密到期的玩家
 * @param {Map} clients - 客户端连接映射
 */
export function kickExpiredPlayers(clients) {
    clients.forEach((context, clientId) => {
        const userTime = userMap.get(context.CDK);
        if (userTime <= 0) {
            kickPlayer(context.client, "卡密已到期");
        }
    });

    setTimeout(() => {
        userBind.syncBindsWithKeys();
    }, 1000);
} 