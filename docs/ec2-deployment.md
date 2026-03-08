# =====================================================
# EC2 Deployment Commands for Network Monitoring Stack
# =====================================================

# SSH into your EC2 first:
# ssh -i your-key.pem ubuntu@51.20.52.19

# =====================================================
# 1. PULL DOCKER IMAGES
# =====================================================

# Pull Prometheus
docker pull prom/prometheus:latest

# Pull SNMP Exporter  
docker pull prom/snmp_exporter:latest

# Pull Grafana
docker pull grafana/grafana:latest

# =====================================================
# 2. CREATE DIRECTORIES
# =====================================================

sudo mkdir -p /var/lib/prometheus
sudo mkdir -p /var/lib/grafana
sudo mkdir -p /etc/prometheus

# =====================================================
# 3. START SERVICES
# =====================================================

# Start SNMP Exporter (must run first)
docker run -d \
  --name snmp_exporter \
  --network host \
  prom/snmp_exporter:latest

# Start Prometheus
docker run -d \
  --name prometheus \
  --network host \
  -v /var/lib/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus:latest \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/prometheus

# Start Grafana
docker run -d \
  --name grafana \
  -p 3000:3000 \
  -v /var/lib/grafana:/var/lib/grafana \
  grafana/grafana:latest

# =====================================================
# 4. UPLOAD prometheus.yml TO EC2
# =====================================================

# Upload the prometheus.yml file to EC2, then copy it:
# scp -i your-key.pem prometheus.yml ubuntu@51.20.52.19:~/
# ssh -i your-key.pem ubuntu@51.20.52.19
# sudo cp prometheus.yml /var/lib/prometheus/prometheus.yml

# Restart Prometheus after copying config:
# docker restart prometheus

# =====================================================
# 5. CHECK STATUS
# =====================================================

# Check running containers
docker ps

# View Prometheus logs
docker logs prometheus

# View SNMP Exporter logs
docker logs snmp_exporter

# View Grafana logs
docker logs grafana

# =====================================================
# 6. ACCESS URLs (after adding security group rules)
# =====================================================

# Prometheus: http://51.20.52.19:9090
# Grafana:   http://51.20.52.19:3000
# SNMP:      http://51.20.52.19:9116
