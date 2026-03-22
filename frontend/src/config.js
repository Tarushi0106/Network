// Frontend Configuration
// For development: use localhost
// For production: use your server IP/domain

// Use environment variables if available (for Vite), otherwise use defaults
const CONFIG = {
  // VITE_API_URL and VITE_GRAFANA_URL can be set in Amplify environment variables
  API_URL: import.meta.env.VITE_API_URL || 'http://51.20.52.19:5000',
  GRAFANA_URL: import.meta.env.VITE_GRAFANA_URL || 'http://51.20.52.19:3000',
};

// Export for use in components
export default CONFIG;
