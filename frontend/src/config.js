// Frontend Configuration
// For production: Direct to EC2 with HTTPS

const API_BASE = "https://51.20.52.19/api";

const CONFIG = {
  // Direct API URL to EC2 (bypasses Amplify proxy)
  API_URL: API_BASE,
  GRAFANA_URL: 'https://51.20.52.19:3000',
};

// Export for use in components
export default CONFIG;
export { API_BASE };
