/**
 * useSystemMetrics Hook
 * ====================
 * React hook for fetching system metrics from the backend API
 * 
 * Why use this hook instead of calling Prometheus directly?
 * --------------------------------------------------------
 * 1. CORS: Prometheus doesn't support CORS - browser requests fail
 * 2. Security: Frontend shouldn't have direct access to Prometheus
 * 3. Clean data: Backend transforms Prometheus responses
 * 4. Simplicity: Just call /api/cpu, /api/memory, etc.
 */

import { useState, useEffect } from 'react';

/**
 * Fetch data from API
 */
async function fetchFromAPI(endpoint) {
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Hook for CPU metrics
 */
export function useCPU() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCPU() {
      try {
        setLoading(true);
        const result = await fetchFromAPI('/api/cpu');
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCPU();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchCPU, 30000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}

/**
 * Hook for Memory metrics
 */
export function useMemory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMemory() {
      try {
        setLoading(true);
        const result = await fetchFromAPI('/api/memory');
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMemory();
    const interval = setInterval(fetchMemory, 30000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}

/**
 * Hook for Network metrics
 */
export function useNetwork() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchNetwork() {
      try {
        setLoading(true);
        const result = await fetchFromAPI('/api/network');
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchNetwork();
    const interval = setInterval(fetchNetwork, 30000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}

/**
 * Hook for Disk metrics
 */
export function useDisk() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDisk() {
      try {
        setLoading(true);
        const result = await fetchFromAPI('/api/disk');
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDisk();
    const interval = setInterval(fetchDisk, 30000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}

/**
 * Hook for all system metrics
 */
export function useSystemMetrics() {
  const cpu = useCPU();
  const memory = useMemory();
  const network = useNetwork();
  const disk = useDisk();

  return {
    cpu: cpu.data,
    cpuLoading: cpu.loading,
    cpuError: cpu.error,
    
    memory: memory.data,
    memoryLoading: memory.loading,
    memoryError: memory.error,
    
    network: network.data,
    networkLoading: network.loading,
    networkError: network.error,
    
    disk: disk.data,
    diskLoading: disk.loading,
    diskError: disk.error,
    
    isLoading: cpu.loading || memory.loading || network.loading || disk.loading,
    error: cpu.error || memory.error || network.error || disk.error
  };
}

export default useSystemMetrics;
