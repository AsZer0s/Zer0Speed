import express from 'express';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { kickExpiredPlayers, kickPlayer } from './kick.js';
import { opt } from './proxy.js';
import { clients } from './server.js';
import { userBind } from './UserBind.js';
import { removeKey } from './userList.js';

const JWT_SECRET = 'Zer0TeamsSafe';

export function startWebServer() {
    const app = express();
    const port = opt.webport || 3001;
    const keyFilePath = path.join(path.resolve(), './key.txt');
    const publicPath = path.join(path.resolve(), './public');
    
    const users = opt.users || {};

    if (opt.trustProxy) {
        app.set('trust proxy', true);
    }

    app.use(express.json());
    app.use(cookieParser());
    app.use(express.static(publicPath));

    app.use((req, res, next) => {
        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log(`[=]WEB请求来自 IP: ${clientIp}`);
        next();
    });

    function authenticateToken(req, res, next) {
        const token = req.cookies.token;
        if (!token) return res.sendStatus(401);

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    }

    app.post('/api/login', (req, res) => {
        const { username, password } = req.body;
        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        if (users[username] && users[username] === password) {
            console.log(`[+]Web用户登录成功: ${username} | IP: ${clientIp}`);
            const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
            res.cookie('token', token, { httpOnly: true });
            res.status(200).json({ message: '登录成功' });
        } else {
            console.log(`[x]Web用户登录失败: ${username} | IP: ${clientIp}`);
            res.status(401).json({ error: '用户名或密码错误' });
        }
    });

    app.get('/api/cards', authenticateToken, (req, res) => {
        console.log('[=]Web加载卡密');
        try {
            const fileData = fs.readFileSync(keyFilePath, 'utf8');
            const lines = fileData.split('\n').filter(line => line.trim() !== '');
            const cards = lines.slice(1, -1).map(line => {
                const [cardNumber, time] = line.split(' ');
                return { cardNumber, time: parseInt(time, 10) };
            });
            res.json(cards);
        } catch (error) {
            console.error('[=]Web加载卡密失败:', error);
            res.status(500).json({ error: '服务器错误' });
        }
    });

    app.post('/api/add-card', authenticateToken, (req, res) => {
        const { cardNumber, time } = req.body;
        console.log(`[=]Web新增卡密: ${cardNumber}, Time: ${time}`);

        if (typeof time !== 'number' || time < 0) {
            return res.status(400).json({ error: '时间必须是非负数' });
        }

        try {
            if (!cardNumber || !time) {
                return res.status(400).json({ error: '缺少卡密或时间' });
            }
            const fileData = fs.readFileSync(keyFilePath, 'utf8');
            const lines = fileData.split('\n');
            lines.splice(lines.length - 1, 0, `${cardNumber} ${time}`);
            fs.writeFileSync(keyFilePath, lines.join('\n'), 'utf8');
            res.status(201).json({ message: '卡密新增成功' });
        } catch (error) {
            console.error('[=]Web新增卡密失败:', error);
            res.status(500).json({ error: '服务器错误' });
        }
    });

    app.delete('/api/delete-card', authenticateToken, (req, res) => {
        const { cardNumber } = req.body;
        console.log(`[=]Web删除卡密: ${cardNumber}`);
        try {
            if (!cardNumber) {
                return res.status(400).json({ error: '缺少卡密' });
            }

            clients.forEach((context, clientId) => {
                if (context.CDK === cardNumber) {
                    console.log(`[=]尝试踢出使用卡密 ${cardNumber} 的玩家`);
                    kickPlayer(context.client, "卡密已被删除");
                }
            });

            setTimeout(() => {
                removeKey(cardNumber);
                console.log(`[+]卡密 ${cardNumber} 已删除，触发热重载`);
                userBind.deleteBind(cardNumber);
                kickExpiredPlayers(clients);
                res.status(200).json({ message: '卡密删除成功' });
            }, 1000);
        } catch (error) {
            console.error('[=]Web删除卡密失败:', error);
            res.status(500).json({ error: '服务器错误' });
        }
    });

    app.listen(port, '127.0.0.1', () => {
        console.log(`[+]Web管理界面已启动在 127.0.0.1:${port}`);
    });
} 