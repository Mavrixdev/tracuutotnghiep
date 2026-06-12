const { kv } = require('@vercel/kv');
const fs = require('fs');
const path = require('path');

const LOCAL_DB_PATH = path.join(process.cwd(), 'tmp', 'database-local.json');

// Check if Vercel KV is configured
const isKvConfigured = () => {
    return !!(process.env.KV_URL || process.env.KV_REST_API_URL);
};

module.exports = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }
    
    try {
        let history = [];
        if (isKvConfigured()) {
            history = await kv.get('dxtn_history_2026') || [];
        } else {
            // Fallback to local file in tmp/ for local testing
            if (fs.existsSync(LOCAL_DB_PATH)) {
                const data = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
                history = JSON.parse(data);
            }
        }
        return res.status(200).json({ success: true, data: history });
    } catch (error) {
        console.error('Error fetching history:', error);
        return res.status(500).json({ success: false, message: 'Không thể truy cập cơ sở dữ liệu.' });
    }
};
