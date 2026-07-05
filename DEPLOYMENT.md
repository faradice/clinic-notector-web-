# Deployment Guide

Complete guide for deploying Clinic Notector Music to production.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 10GB disk space

## Quick Deploy with Docker Compose

### 1. Production Build

```bash
cd clinic-notector-web
docker-compose up -d --build
```

This will:
- Build backend Spring Boot application
- Build frontend React application with Nginx
- Start PostgreSQL database
- Apply Flyway migrations
- Start all services

### 2. Verify Deployment

```bash
# Check all services are running
docker-compose ps

# Check backend health
curl http://localhost:8080/api/actuator/health

# Check frontend
curl http://localhost/health

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 3. Access Application

Open http://localhost in your browser

The application will be available on port 80 (HTTP)

## Environment Configuration

### Backend Environment Variables

Edit `docker-compose.yml` to configure:

```yaml
environment:
  SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/clinic_notector
  SPRING_DATASOURCE_USERNAME: clinic_user
  SPRING_DATASOURCE_PASSWORD: clinic_pass  # Change in production!
  SPRING_JPA_HIBERNATE_DDL_AUTO: validate
  CORS_ALLOWED_ORIGINS: http://localhost,https://yourdomain.com
```

### Frontend Environment Variables

Update `frontend/.env` for production API:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

For production with reverse proxy:

```env
VITE_API_BASE_URL=/api
```

## Production Deployment

### Option 1: Single Server Docker Compose

**Recommended for small-medium deployments**

1. **Copy files to server:**
```bash
scp -r clinic-notector-web user@server:/opt/
```

2. **Update production settings:**
```bash
# On server
cd /opt/clinic-notector-web
nano docker-compose.yml  # Update passwords, origins
```

3. **Start services:**
```bash
docker-compose up -d --build
```

4. **Setup SSL with Let's Encrypt:**
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Update nginx.conf for SSL
```

### Option 2: Kubernetes Deployment

**Recommended for large-scale deployments**

Create Kubernetes manifests:

**postgres-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: clinic_notector
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
```

Deploy:
```bash
kubectl apply -f k8s/
```

### Option 3: Cloud Platforms

#### AWS

**Using Elastic Beanstalk:**
```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p docker clinic-notector

# Create environment
eb create clinic-notector-env

# Deploy
eb deploy
```

**Using ECS:**
- Push Docker images to ECR
- Create ECS task definitions
- Configure Application Load Balancer
- Set up RDS for PostgreSQL

#### Azure

**Using App Service:**
```bash
# Create resource group
az group create --name clinic-notector-rg --location eastus

# Create App Service plan
az appservice plan create --name clinic-notector-plan --resource-group clinic-notector-rg --is-linux

# Deploy containers
az webapp create --resource-group clinic-notector-rg --plan clinic-notector-plan --name clinic-notector-app --multicontainer-config-type compose --multicontainer-config-file docker-compose.yml
```

#### Google Cloud

**Using Cloud Run:**
```bash
# Build and push images
gcloud builds submit --tag gcr.io/PROJECT-ID/clinic-notector-backend backend/
gcloud builds submit --tag gcr.io/PROJECT-ID/clinic-notector-frontend frontend/

# Deploy backend
gcloud run deploy clinic-notector-backend --image gcr.io/PROJECT-ID/clinic-notector-backend --platform managed

# Deploy frontend
gcloud run deploy clinic-notector-frontend --image gcr.io/PROJECT-ID/clinic-notector-frontend --platform managed
```

## Monitoring

### Health Checks

Backend health endpoint:
```bash
curl http://localhost:8080/api/actuator/health
```

Response:
```json
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "diskSpace": {"status": "UP"}
  }
}
```

Frontend health endpoint:
```bash
curl http://localhost/health
```

### Metrics

Access metrics at:
```
http://localhost:8080/api/actuator/metrics
```

Key metrics:
- `jvm.memory.used`
- `http.server.requests`
- `hikaricp.connections.active`

### Logging

View logs:
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# With timestamp
docker-compose logs -f --timestamps backend
```

Configure log levels in `application.yml`:
```yaml
logging:
  level:
    root: INFO
    com.raggi.clinicnotector: DEBUG
```

## Backup & Recovery

### Database Backup

**Manual backup:**
```bash
docker exec clinic-notector-db pg_dump -U clinic_user clinic_notector > backup.sql
```

**Automated backup (cron):**
```bash
# Add to crontab
0 2 * * * docker exec clinic-notector-db pg_dump -U clinic_user clinic_notector | gzip > /backups/clinic-notector-$(date +\%Y\%m\%d).sql.gz
```

**Restore:**
```bash
docker exec -i clinic-notector-db psql -U clinic_user clinic_notector < backup.sql
```

### Volume Backup

```bash
# Stop services
docker-compose down

# Backup volume
docker run --rm -v clinic-notector-web_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data.tar.gz /data

# Restore volume
docker run --rm -v clinic-notector-web_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_data.tar.gz -C /
```

## Scaling

### Horizontal Scaling

**Backend:**
```yaml
backend:
  deploy:
    replicas: 3
  # Add load balancer
```

**Database:**
- Use managed database (AWS RDS, Azure Database, Google Cloud SQL)
- Configure read replicas
- Enable connection pooling

### Performance Tuning

**Backend:**
```yaml
environment:
  JAVA_OPTS: "-Xms512m -Xmx2g -XX:+UseG1GC"
  SPRING_JPA_PROPERTIES_HIBERNATE_JDBC_BATCH_SIZE: 20
  SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE: 20
```

**Frontend:**
- Enable Nginx gzip compression (already configured)
- Use CDN for static assets
- Enable browser caching

## Security Checklist

- [ ] Change default database password
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Enable CORS only for trusted origins
- [ ] Regular security updates
- [ ] Database encryption at rest
- [ ] Backup encryption
- [ ] API rate limiting
- [ ] Input validation
- [ ] SQL injection protection (JPA handles this)

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready - wait for health check
# 2. Port already in use - change port in docker-compose.yml
# 3. Memory issues - increase Docker memory limit
```

### Frontend can't connect to backend

```bash
# Check nginx config
docker exec clinic-notector-frontend cat /etc/nginx/conf.d/default.conf

# Check CORS settings in backend
# Check VITE_API_BASE_URL in frontend build
```

### Database connection issues

```bash
# Test connection
docker exec -it clinic-notector-db psql -U clinic_user -d clinic_notector

# Check connection pool
curl http://localhost:8080/api/actuator/metrics/hikaricp.connections.active
```

## Maintenance

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Or zero-downtime with rolling update (K8s)
kubectl rollout restart deployment/backend
```

### Database Migrations

Flyway migrations run automatically on startup. To run manually:

```bash
docker exec clinic-notector-backend java -jar app.jar --spring.flyway.enabled=true
```

### Clean Up

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: deletes data!)
docker-compose down -v

# Remove images
docker rmi clinic-notector-web_backend clinic-notector-web_frontend

# Prune unused Docker resources
docker system prune -a
```

## Support

For issues:
1. Check logs: `docker-compose logs`
2. Verify health: `curl http://localhost:8080/api/actuator/health`
3. Review this guide
4. Check GitHub issues: https://github.com/anthropics/claude-code/issues
