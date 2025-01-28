import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const keyFilePath = path.join(path.resolve(), 'key.txt');

router.post('/add-card', (req, res) => {
    try {
        const { cardNumber, time } = req.body;
        
        if (!cardNumber || !time) {
            return res.status(400).json({ error: '缺少卡密或时间' });
        }

        const cardData = `${cardNumber} ${time}\n`;
        fs.appendFileSync(keyFilePath, cardData, 'utf8');

        res.status(201).json({ message: '卡密新增成功' });
    } catch (error) {
        console.error('新增卡密时出错:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.delete('/delete-card', (req, res) => {
    try {
        const { cardNumber } = req.body;

        if (!cardNumber) {
            return res.status(400).json({ error: '缺少卡密' });
        }

        const fileData = fs.readFileSync(keyFilePath, 'utf8');
        const lines = fileData.split('\n');

        const updatedLines = lines.filter(line => !line.startsWith(cardNumber));

        fs.writeFileSync(keyFilePath, updatedLines.join('\n'), 'utf8');

        res.status(200).json({ message: '卡密删除成功' });
    } catch (error) {
        console.error('删除卡密时出错:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

export default router; 