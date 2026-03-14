const express = require("express");
const router = express.Router();
const axios = require("axios");

const PROMETHEUS_URL = "http://localhost:9090";

router.get("/", async (req, res) => {
  try {

    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/alerts`);

    const alerts = response.data.data.alerts || [];

    const formattedAlerts = alerts.map(a => ({
      name: a.labels.alertname,
      device: a.labels.instance,
      severity: a.labels.severity,
      state: a.state,
      activeAt: a.activeAt
    }));

    res.json({ alerts: formattedAlerts });

  } catch (err) {
    console.error("Alert fetch error:", err.message);
    res.json({ alerts: [] });
  }
});

module.exports = router;
