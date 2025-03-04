import { createServer as createTcpServer } from 'net';
import { userMap, saveList } from './userList.js';
import fs from 'fs';
import path from 'path';
import { kickPlayer, kickExpiredPlayers } from './kick.js';

const options = JSON.parse(fs.readFileSync(path.join(path.resolve(), 'option.json'), 'utf8'));
const { token: validToken } = options;

const keyFilePath = path.join(path.resolve(), 'key.txt');

var clientCount = 0;
export const clients = new Map();

export function createSer(callBack, port) {
    createTcpServer(function (client) {
        var clientId = clientCount++;
        var context = callBack(client, clientId);
        context.client = client;
        clients.set(clientId, context);

        console.log("[+]客户端连接: " + clientId);
        client.setNoDelay(true);
        var toServer = context.s;
        client.on("end", function () {
            console.log("[-]客户端断开: " + clientId);
            clients.delete(clientId);
            if (context.user && context.state == 2) {
                userMap.set(context.CDK, userMap.get(context.CDK) - Math.round((Date.now() - context.startTime) / 1000));
                saveList();
            }
            if (context.o)
                context.o.destroy();
        });
        client.on("error", function () {
            console.log("[x]连接错误: " + clientId);
            clients.delete(clientId);
            client.destroy();
            if (context.o)
                context.o.destroy();
        });
        client.on("data", function (data) {
            if (context.thr) {
                context.so.write(data);
            } else if (toServer.next(data).done) {
                console.log("[-]踢出: " + clientId);
                kickPlayer(client, "不符合条件");
                if (context.o)
                    context.o.destroy();
            }
        });
    }).listen(port, () => {
        console.log("TCP玩家登录已启动在端口: " + port);
    });
}

setInterval(() => {
    clients.forEach((context, clientId) => {
        if (context.user && context.state == 2) {
            const elapsedTime = Math.round((Date.now() - context.startTime) / 1000);
            userMap.set(context.CDK, userMap.get(context.CDK) - elapsedTime);
            context.startTime = Date.now();
        }
    });
    saveList();
    console.log("[-]用户时间已刷新");
}, 5 * 60 * 1000);

let previousLineCount = 0;
fs.watch(keyFilePath, (eventType) => {
    if (eventType === 'change') {
        const fileData = fs.readFileSync(keyFilePath, 'utf8');
        const currentLineCount = fileData.split('\n').length;
        if (currentLineCount < previousLineCount) {
            kickExpiredPlayers(clients);
            console.log("[-]检测到过期卡密，已踢出到期玩家");
        }
        previousLineCount = currentLineCount;
    }
});

process.stdin.on('data', (input) => {
    const command = input.toString().trim();
    if (command === 'kick-expired') {
        kickExpiredPlayers(clients);
    }
});
