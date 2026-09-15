const express = require('express');
const router = express.Router();

// GET /api/health
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Polygon Mobile App Manager Backend',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
