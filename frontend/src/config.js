// Frontend Configuration
// For production: Direct to EC2 with HTTPS

const CONFIG = {
  // Direct API URL to EC2 (bypasses Amplify proxy)
  API_URL: 'https://51.20.52.19',
  GRAFANA_URL: 'https://51.20.52.19:3000',
};

// Export for use in components
export default CONFIG;
