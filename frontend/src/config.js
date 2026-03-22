// Frontend Configuration
// For production: Direct to Cloudflare tunnel

const API_BASE = "https://weed-promotions-satisfy-oaks.trycloudflare.com/api";

const CONFIG = {
  // Direct API URL to backend
  API_URL: API_BASE,
  GRAFANA_URL: 'https://weed-promotions-satisfy-oaks.trycloudflare.com:3000',
};

// Export for use in components
export default CONFIG;
export { API_BASE };
