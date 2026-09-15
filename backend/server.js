const express = require('express');
const cors = require('cors');

// Role-based routes
const healthRoutes = require('./src/common/routes/healthRoutes');
const scaleRoutes = require('./src/developer/routes/scaleRoutes');
const scaleSimulator = require('./src/developer/services/scaleSimulator');

const app = express();
const PORT = process.env.PORT || 8001;

app.use(cors());
app.use(express.json());

// 1. Common / Shared Routes
app.use('/api', healthRoutes);

// 2. Developer Role Routes
app.use('/api/scale', scaleRoutes);

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
