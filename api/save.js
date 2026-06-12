module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    try {
        const record = req.body;
        if (!record || !record.name || typeof record.score !== 'number') {
            return res.status(400).json({ success: false, message: 'Dữ liệu gửi lên không hợp lệ.' });
        }

        const ip = req.headers['x-real-ip'] ||
            (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
            req.socket.remoteAddress ||
            '127.0.0.1';

        record.ip = ip;
        record.createdAt = new Date();

        const { db } = await require('./_mongo').connectToDatabase();
        await db.collection('leaderboard').insertOne(record);

        return res.status(200).json({ success: true, message: 'Đã lưu kết quả lên MongoDB.' });
    } catch (error) {
        console.error('Error saving to MongoDB:', error);
        return res.status(500).json({ success: false, message: 'Không thể lưu kết quả. Vui lòng thử lại.' });
    }
};
