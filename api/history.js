const fs = require('fs');
const path = require('path');

const LOCAL_DB_PATH = path.join(process.cwd(), 'tmp', 'database-local.json');

const isMongoConfigured = () => {
    return !!process.env.MONGODB_URI;
};

module.exports = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }
    
    try {
        let history = [];
        if (isMongoConfigured()) {
            try {
                const { db } = await require('./_mongo').connectToDatabase();
                if (db) {
                    history = await db.collection('leaderboard')
                        .find({})
                        .sort({ score: -1 })
                        .limit(100)
                        .toArray();
                    return res.status(200).json({ success: true, data: history });
                }
            } catch (mongoError) {
                console.warn('MongoDB connection failed, falling back to local file storage:', mongoError.message);
            }
        }
        
        // Fallback to local file in tmp/ for local testing
        if (fs.existsSync(LOCAL_DB_PATH)) {
            const data = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
            history = JSON.parse(data);
        }
        return res.status(200).json({ success: true, data: history });
    } catch (error) {
        console.error('Error fetching history:', error);
        return res.status(500).json({ success: false, message: 'Không thể truy cập cơ sở dữ liệu.' });
    }
};
