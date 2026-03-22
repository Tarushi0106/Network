import { useState, useEffect, useCallback } from 'react';

const API_URL = '';

/**
 * Custom hook for fetching device data
 */
export function useDevices() {
  const [devices, setDevices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/devices`);
      const data = await response.json();
      
      if (data.success) {
        setDevices(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  return { devices, loading, error, refetch: fetchDevices };
}

/**
 * Custom hook for fetching network health data
 */
export function useNetworkHealth() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/network-health`);
      const data = await response.json();
      
      if (data.success) {
        setHealthData(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  return { healthData, loading, error, refetch: fetchHealth };
}

/**
 * Custom hook for fetching alerts
 */
export function useAlerts(limit = 10) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/alerts?limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        setAlerts(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchAlerts();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return { alerts, loading, error, refetch: fetchAlerts };
}

/**
 * Custom hook for fetching bandwidth data
 */
export function useBandwidth(routerIp, duration = '1h') {
  const [bandwidthData, setBandwidthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBandwidth = useCallback(async () => {
    if (!routerIp) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/bandwidth/${routerIp}?duration=${duration}`);
      const data = await response.json();
      
      if (data.success) {
        setBandwidthData(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [routerIp, duration]);

  useEffect(() => {
    fetchBandwidth();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchBandwidth, 30000);
    return () => clearInterval(interval);
  }, [fetchBandwidth]);

  return { bandwidthData, loading, error, refetch: fetchBandwidth };
}

/**
 * Custom hook for fetching all locations
 */
export function useLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/bandwidth/locations`);
      const data = await response.json();
      
      if (data.locations) {
        setLocations(data.locations);
      } else {
        setError('Failed to fetch locations');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return { locations, loading, error, refetch: fetchLocations };
}

/**
 * Custom hook for fetching top bandwidth usage
 */
export function useTopBandwidth() {
  const [topBandwidthData, setTopBandwidthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTopBandwidth = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/bandwidth/top`);
      const data = await response.json();
      
      if (data.success) {
        setTopBandwidthData(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopBandwidth();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchTopBandwidth, 30000);
    return () => clearInterval(interval);
  }, [fetchTopBandwidth]);

  return { topBandwidthData, loading, error, refetch: fetchTopBandwidth };
}
