const express = require('express');
const router = express.Router();

router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:8000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});

module.exports = router;
