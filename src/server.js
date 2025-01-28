import { createServer as createTcpServer } from 'net';
import { createServer as createHttpServer } from 'http';
import { userMap, saveList } from './userList.js';
import fs from 'fs';
import path from 'path';
import { kickPlayer, kickExpiredPlayers } from './kick.js';

const options = JSON.parse(fs.readFileSync(path.join(path.resolve(), 'option.json'), 'utf8'));
const { token: validToken } = options;

const keyFilePath = path.join(path.resolve(), 'key.txt');

var clientCount = 0;
const clients = new Map();

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
}, 5 * 60 * 10000);

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

createHttpServer((req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== `Bearer ${validToken}`) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '未授权的请求' }));
        return;
    }

    if (req.method === 'POST' && req.url === '/api/add-card') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { cardNumber, time } = JSON.parse(body);
                if (!cardNumber || !time) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: '缺少卡密或时间' }));
                    return;
                }
                const fileData = fs.readFileSync(keyFilePath, 'utf8');
                const lines = fileData.split('\n');
                lines.splice(lines.length - 2, 0, `${cardNumber} ${time}`);
                fs.writeFileSync(keyFilePath, lines.join('\n'), 'utf8');
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: '卡密新增成功' }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '无效的JSON输入' }));
            }
        });
    } else if (req.method === 'DELETE' && req.url === '/api/delete-card') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { cardNumber } = JSON.parse(body);
                if (!cardNumber) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: '缺少卡密' }));
                    return;
                }
                const fileData = fs.readFileSync(keyFilePath, 'utf8');
                const lines = fileData.split('\n');
                const cardExists = lines.some(line => line.startsWith(cardNumber));

                if (!cardExists) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: '卡密不存在' }));
                    return;
                }

                const updatedLines = lines.filter(line => !line.startsWith(cardNumber));
                fs.writeFileSync(keyFilePath, updatedLines.join('\n'), 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: '卡密删除成功' }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '无效的JSON输入' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '未找到请求的资源' }));
    }
}).listen(3000, () => {
    console.log('HTTP API已启动在端口: 3000');
});