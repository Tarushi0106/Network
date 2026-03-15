const express = require("express");
const router = express.Router();
const axios = require("axios");

// Use EC2 IP for Prometheus - NOT localhost
const PROMETHEUS_URL = "http://51.20.52.19:9090";

router.get("/", async (req, res) => {
  try {
    console.log("=== FETCHING ALERTS ===");
    console.log("Fetching from:", `${PROMETHEUS_URL}/api/v1/alerts`);

    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/alerts`);

    console.log("Response status:", response.status);
    console.log("Full response data:", JSON.stringify(response.data, null, 2));

    // Prometheus API response structure:
    // { status: "success", data: { alerts: [...] } }
    
    const result = response.data;
    
    if (result.status !== "success") {
      console.log("Prometheus returned error status:", result.status);
      return res.json({ 
        success: false,
        count: 0,
        data: [],
        error: result.error
      });
    }

    const alerts = result.data?.alerts || [];
    console.log(`Found ${alerts.length} alerts in Prometheus`);

    // Log each alert
    alerts.forEach((alert, i) => {
      console.log(`Alert ${i}:`, JSON.stringify(alert));
    });

    const formattedAlerts = alerts.map(a => ({
      name: a.labels?.alertname,
      device: a.labels?.instance,
      severity: a.labels?.severity,
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
    console.error("Error details:", err.response?.data);
    res.json({ 
      success: false,
      count: 0,
      data: [],
      error: err.message
    });
  }
});

module.exports = router;
