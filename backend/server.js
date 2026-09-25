const express = require('express');
const cors = require('cors');

// Modular routes
const healthRoutes = require('./src/common/routes/healthRoutes');
const scaleRoutes = require('./src/scale/routes/scaleRoutes');
const scaleSimulator = require('./src/scale/services/scaleSimulator');
const developerHealthRoutes = require('./src/developer/routes/healthCheckRoutes');

const app = express();
const PORT = process.env.PORT || 8001;

app.use(cors());
app.use(express.json());

// 1. Common Health Routes
app.use('/api', healthRoutes);

// 2. Wi-Fi Scale Routes (QA & Developer)
app.use('/api/scale', scaleRoutes);

// 3. Developer Health Check Routes
app.use('/api/developer', developerHealthRoutes);

// Direct weight endpoint (mirrors scale bridge)
app.get('/api/weight', (req, res) => {
  const status = scaleSimulator.getStatus();
  res.json({
    weight: status.config.currentWeight,
    unit: 'kg',
    connected: status.isRunning,
    stale: false,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Polygon Mobile Operations Backend running at http://localhost:${PORT}`);
});
