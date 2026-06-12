module.exports = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    try {
        const { db } = await require('./_mongo').connectToDatabase();
        const history = await db.collection('leaderboard')
            .find({})
            .sort({ score: -1 })
            .limit(100)
            .toArray();

        return res.status(200).json({ success: true, data: history });
    } catch (error) {
        console.error('Error fetching from MongoDB:', error);
        return res.status(500).json({ success: false, message: 'Không thể tải dữ liệu. Vui lòng thử lại.' });
    }
};
