import express from 'express';
import fs from 'fs';
import path from 'path';

export function startWebServer() {
    const app = express();
    const port = 3001;
    const keyFilePath = path.join(path.resolve(), './key.txt');
    const publicPath = path.join(path.resolve(), './public');
    
    const users = {
        admin: 'password'
    };

    app.use(express.json());
    app.use(express.static(publicPath));

    app.post('/api/login', (req, res) => {
        const { username, password } = req.body;
        const clientIp = req.ip;
        if (users[username] && users[username] === password) {
            console.log(`[+]Web用户登录成功: ${username} | IP: ${clientIp}`);
            res.status(200).json({ message: '登录成功' });
        } else {
            console.log(`[x]Web用户登录失败: ${username} | IP: ${clientIp}`);
            res.status(401).json({ error: '用户名或密码错误' });
        }
    });

    app.get('/api/cards', (req, res) => {
        console.log('[=]Web加载卡密...');
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

    app.post('/api/add-card', (req, res) => {
        const { cardNumber, time } = req.body;
        console.log(`[=]Web新增卡密: ${cardNumber}, Time: ${time}`);
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

    app.delete('/api/delete-card', (req, res) => {
        const { cardNumber } = req.body;
        console.log(`[=]Web删除卡密: ${cardNumber}`);
        try {
            if (!cardNumber) {
                return res.status(400).json({ error: '缺少卡密' });
            }
            const fileData = fs.readFileSync(keyFilePath, 'utf8');
            const lines = fileData.split('\n');
            const updatedLines = lines.filter(line => !line.startsWith(cardNumber));
            if (lines.length === updatedLines.length) {
                return res.status(404).json({ error: '卡密不存在' });
            }
            fs.writeFileSync(keyFilePath, updatedLines.join('\n'), 'utf8');
            res.status(200).json({ message: '卡密删除成功' });
        } catch (error) {
            console.error('[=]Web删除卡密失败:', error);
            res.status(500).json({ error: '服务器错误' });
        }
    });

    app.listen(port, () => {
        console.log(`[+]Web管理界面已启动在端口: ${port}`);
    });
} 