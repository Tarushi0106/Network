// Frontend Configuration
// For development: use localhost
// For production: use your server IP/domain

// Use environment variables if available (for Vite), otherwise use empty (relative URLs)
const CONFIG = {
  // VITE_API_URL and VITE_GRAFANA_URL can be set in Amplify environment variables
  // For production, use relative URLs to avoid Mixed Content errors
  API_URL: import.meta.env.VITE_API_URL || '',
  GRAFANA_URL: import.meta.env.VITE_GRAFANA_URL || '',
};

// Export for use in components
export default CONFIG;
