# 网站监控系统 (Docker 版)

基于 Docker 部署的网站监控系统，支持 HTTP/TCP/Komari 面板监控。

## 快速开始

### 使用 Docker Compose (推荐)

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

### 使用 Docker

```bash
# 构建镜像
docker build -t uptime-monitor .

# 运行容器
docker run -d \
  --name uptime-monitor \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  uptime-monitor
```

## 访问

打开浏览器访问 `http://localhost:3000`

**默认密码**: `admin123`

## 数据持久化

数据存储在 `./data` 目录中（SQLite 数据库）

## 环境变量

| 变量 | 默认值 | 说明 |
|-----|--------|------|
| PORT | 3000 | 服务端口 |
| DATA_DIR | /app/data | 数据目录 |

## 功能

- HTTP/HTTPS 检测
- TCP 连通性检测
- Komari 面板监控
- Webhook 通知
- 关键词检测
- 禁止关键词检测
- 定时检测（每5分钟）
