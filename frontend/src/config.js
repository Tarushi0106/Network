// Frontend Configuration
// For development: use localhost
// For production: use your server IP/domain

// Set to your production server URL, or leave empty for auto-detection
const CONFIG = {
  // Use this for production - change to your server IP/domain
  API_URL: 'http://51.20.52.19:5000',
  GRAFANA_URL: 'http://51.20.52.19:3000',
  
  // Or leave empty to auto-detect from current host
  // API_URL: '',
  // GRAFANA_URL: ''
};

// Export for use in components
export default CONFIG;
