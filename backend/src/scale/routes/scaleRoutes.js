const express = require('express');
const router = express.Router();
const scaleSimulator = require('../services/scaleSimulator');

// GET /api/scale/status
router.get('/status', (req, res) => {
  res.json(scaleSimulator.getStatus());
});

// POST /api/scale/start
router.post('/start', async (req, res) => {
  const { tcpPort = 33581, httpPort = 3001 } = req.body || {};
  const result = await scaleSimulator.start(tcpPort, httpPort);
  res.json({ ...result, status: scaleSimulator.getStatus() });
});

// POST /api/scale/stop
router.post('/stop', async (req, res) => {
  const result = await scaleSimulator.stop();
  res.json({ ...result, status: scaleSimulator.getStatus() });
});

// POST /api/scale/config
router.post('/config', (req, res) => {
  const updated = scaleSimulator.updateConfig(req.body);
  res.json({ success: true, config: updated, status: scaleSimulator.getStatus() });
});

module.exports = router;
