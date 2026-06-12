const { kv } = require('@vercel/kv');
const fs = require('fs');
const path = require('path');

const LOCAL_DB_PATH = path.join(process.cwd(), 'tmp', 'database-local.json');

// Check if Vercel KV is configured
const isKvConfigured = () => {
    return !!(process.env.KV_URL || process.env.KV_REST_API_URL);
};

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
        
        // Extract client IP address from headers (Vercel proxies) or socket
        const ip = req.headers['x-real-ip'] || 
                   (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) || 
                   req.socket.remoteAddress || 
                   '127.0.0.1';
        
        // Add IP address metadata to the candidate record
        record.ip = ip;
        
        let history = [];
        if (isKvConfigured()) {
            history = await kv.get('dxtn_history_2026') || [];
            history.unshift(record);
            if (history.length > 100) history.length = 100;
            await kv.set('dxtn_history_2026', history);
        } else {
            // Local file database fallback
            const dir = path.dirname(LOCAL_DB_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            if (fs.existsSync(LOCAL_DB_PATH)) {
                const data = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
                history = JSON.parse(data);
            }
            history.unshift(record);
            if (history.length > 100) history.length = 100;
            fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(history, null, 2), 'utf8');
        }
        
        return res.status(200).json({ success: true, message: 'Đã lưu kết quả kèm địa chỉ IP.' });
    } catch (error) {
        console.error('Error saving history:', error);
        return res.status(500).json({ success: false, message: 'Không thể ghi cơ sở dữ liệu.' });
    }
};
