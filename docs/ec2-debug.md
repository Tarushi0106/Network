# EC2 Prometheus Debugging Steps

## Problem: prometheus.yml file not found
The file is at `prometheus/prometheus.yml` (not in the root directory).

## CORRECT upload command:
```bash
scp -i network.pem prometheus/prometheus.yml ubuntu@51.20.52.19:~/Network/
```

## On EC2, verify:
```bash
ls -la ~/Network/prometheus.yml
```

## If still missing, check what PM2 is using:
```bash
pm2 show prometheus
```

## Check Prometheus logs:
```bash
pm2 logs prometheus --lines 30
```

## If port not binding, check if Prometheus is binding to wrong interface:
```bash
# Start Prometheus manually to see errors:
cd ~/Network
./prometheus --config.file=prometheus.yml --web.listen-address=0.0.0.0:9090
```

## Make sure security group allows port 9090:
- Go to AWS EC2 Console
- Security Groups
- Add Inbound Rule: Custom TCP | 9090 | 0.0.0.0/0
