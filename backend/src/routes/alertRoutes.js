const express = require("express");
const router = express.Router();
const axios = require("axios");

// Use EC2 IP for Prometheus - NOT localhost
const PROMETHEUS_URL = "http://51.20.52.19:9090";

router.get("/", async (req, res) => {
  try {
    console.log("Fetching alerts from:", `${PROMETHEUS_URL}/api/v1/alerts`);

    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/alerts`);

    console.log("Prometheus response status:", response.status);
    console.log("Prometheus response data:", JSON.stringify(response.data).substring(0, 500));

    const alerts = response.data.data.alerts || [];

    console.log(`Found ${alerts.length} alerts in Prometheus`);

    const formattedAlerts = alerts.map(a => ({
      name: a.labels.alertname,
      device: a.labels.instance,
      severity: a.labels.severity,
      state: a.state,
      activeAt: a.activeAt,
      description: a.annotations?.description || ""
    }));

    res.json({ 
      success: true,
      count: formattedAlerts.length,
      data: formattedAlerts 
    });

  } catch (err) {
    console.error("Alert fetch error:", err.message);
    res.json({ 
      success: false,
      count: 0,
      data: [] 
    });
  }
});

module.exports = router;
