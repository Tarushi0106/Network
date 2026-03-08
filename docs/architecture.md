/**
 * Network Monitoring Dashboard System
 * ======================================
 * 
 * System Architecture:
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                        NETWORK MONITORING ARCHITECTURE                  │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────────┐
 * │  MikroTik       │     │  SNMP Exporter  │     │  Prometheus              │
 * │  Routers        │────▶│  (SNMP)         │────▶│  (Metrics Collection)    │
 * │                 │     │                 │     │                          │
 * │ • Ganpati Peth  │     │ • ifHCInOctets  │     │ • rate(ifHCInOctets[5m]) │
 * │ • Gadhinglaj    │     │ • ifHCOutOctets │     │ • rate(ifHCOutOctets[5m])│
 * │ • Market Yard   │     │                 │     │                          │
 * │ • Miraj         │     │                 │     │                          │
 * │ • Kothrud Pune  │     │                 │     │                          │
 * └─────────────────┘     └─────────────────┘     └───────────┬─────────────┘
 *                                                               │
 *                                                               ▼
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                           APIS & DATA FLOW                              │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 *                      ┌──────────────────────┐
 *                      │   Node.js Backend    │
 *                      │   (Express.js)       │
 *                      └──────────┬───────────┘
 *                                 │
 *            ┌────────────────────┼────────────────────┐
 *            ▼                    ▼                    ▼
 *     ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
 *     │  MongoDB    │      │  Prometheus │      │   Grafana   │
 *     │             │      │    API      │      │    API      │
 *     │ Locations   │      │             │      │             │
 *     │ Metadata    │      │ Query       │      │ Dashboards  │
 *     │ Config      │      │ Metrics     │      │ Panels      │
 *     └─────────────┘      └─────────────┘      └─────────────┘
 *                                 │
 *                                 ▼
 *                      ┌──────────────────────┐
 *                      │   React Frontend     │
 *                      │   (NOC Dashboard)    │
 *                      └──────────────────────┘
 * 
 * 
 * DATA FLOW:
 * ==========
 * 
 * 1. Router Metrics Collection:
 *    MikroTik Router ──SNMP──▶ SNMP Exporter ──HTTP──▶ Prometheus
 * 
 * 2. API Data Flow:
 *    React Frontend ──HTTP──▶ Node.js API ──HTTP──▶ Prometheus API
 *                                       │
 *                                       ▼
 *                                MongoDB (Locations)
 * 
 * 3. Visualization:
 *    • Grafana dashboards for detailed analysis
 *    • React dashboard for user-friendly NOC view
 *    • Leaflet maps for geographic visualization
 * 
 * 
 * COMPONENTS:
 * ===========
 * 
 * Backend (Node.js + Express):
 * ────────────────────────────
 * • /api/routers         - Get all router locations
 * • /api/routers/:id      - Get single router details
 * • /api/metrics/bandwidth - Get bandwidth metrics from Prometheus
 * • /api/metrics/realtime  - Real-time bandwidth polling
 * • /api/status          - Router online/offline status
 * • /api/alerts          - Get active alerts
 * • /api/grafana         - Grafana integration endpoints
 * 
 * Frontend (React):
 * ─────────────────
 * • Dashboard with location cards
 * • Bandwidth graphs (recharts)
 * • Network map (leaflet)
 * • Location filter dropdown
 * • Status indicators
 * • Alert notifications
 * 
 * Database (MongoDB):
 * ───────────────────
 * • routers collection - Router locations and metadata
 * • alerts collection  - Alert history
 * • settings collection - System configuration
 * 
 * 
 * PORTS:
 * ======
 * • Prometheus:    9090
 * • Grafana:       3000
 * • Node.js API:   5000
 * • React Frontend: 3001
 * • MongoDB:       27017
 * • SNMP Exporter: 9116
 */

{
  "system": "Network Monitoring Dashboard",
  "version": "1.0.0",
  "architecture": "multi-tier",
  "components": {
    "data_collection": ["MikroTik Routers", "SNMP Exporter", "Prometheus"],
    "backend": ["Node.js", "Express.js", "MongoDB"],
    "frontend": ["React", "Recharts", "Leaflet"],
    "visualization": ["Grafana", "Custom Dashboard"]
  }
}
