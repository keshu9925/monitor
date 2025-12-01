import { useState, useEffect } from 'react'
import { Monitor, MonitorCheck, KomariServer, deleteMonitor, testWebhook, checkNow, getKomariStatus } from '../lib/api'

// 从国旗 emoji 提取国家代码
function extractCountryCode(region: string): string {
  // 检查是否是国旗 emoji (由两个 regional indicator symbols 组成)
  const match = region.match(/[\u{1F1E6}-\u{1F1FF}]{2}/u)
  if (match) {
    const flag = match[0]
    // 将 regional indicator 转换为字母
    const chars = [...flag]
    const code = chars.map(c => String.fromCharCode(c.codePointAt(0)! - 0x1F1E6 + 65)).join('')
    return code.toLowerCase()
  }
  // 如果是普通国家代码
  return region.toLowerCase().trim()
}

// 获取国旗图片 URL
function getFlagUrl(region: string): string {
  const code = extractCountryCode(region)
  return `https://flagcdn.com/24x18/${code}.png`
}

interface MonitorCardProps {
  monitor: Monitor & { latestCheck?: MonitorCheck; uptime?: number }
  onUpdate: () => void
  onEdit: () => void
}

export default function MonitorCard({ monitor, onUpdate, onEdit }: MonitorCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [komariServers, setKomariServers] = useState<KomariServer[]>([])
  const [isLoadingServers, setIsLoadingServers] = useState(false)

  // 对于 Komari 监控，使用实时服务器状态来判断
  const komariRealTimeStatus = monitor.check_type === 'komari' && komariServers.length > 0
    ? (komariServers.every(s => s.is_online) ? 'up' : 'down')
    : null

  // 优先使用 Komari 实时状态，否则使用 latestCheck
  const status = komariRealTimeStatus || monitor.latestCheck?.status || 'unknown'
  const statusColor = status === 'up' ? '#10b981' : status === 'down' ? '#ef4444' : '#6b7280'
  const statusText = status === 'up' ? '正常' : status === 'down' ? '故障' : '未知'

  useEffect(() => {
    if (monitor.check_type === 'komari') {
      loadKomariServers()
    }
  }, [monitor.id, monitor.check_type])

  async function loadKomariServers() {
    setIsLoadingServers(true)
    try {
      const result = await getKomariStatus(monitor.id)
      setKomariServers(result.servers)
    } catch (error) {
      console.error('Failed to load Komari servers:', error)
    } finally {
      setIsLoadingServers(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`确定要删除监控 "${monitor.name}" 吗？`)) return

    setIsDeleting(true)
    try {
      await deleteMonitor(monitor.id)
      onUpdate()
    } catch (error) {
      console.error('Error deleting monitor:', error)
      alert('删除失败')
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleTestWebhook() {
    if (!monitor.webhook_url) {
      alert('此监控未配置Webhook')
      return
    }

    setIsTesting(true)
    try {
      const result = await testWebhook(monitor.id)

      if (result.success) {
        alert('Webhook测试成功！请检查接收端是否收到通知。')
      } else {
        alert(`Webhook测试失败: ${result.message || '未知错误'}`)
      }
    } catch (err: any) {
      alert(`Webhook测试失败: ${err.message || '请稍后重试'}`)
    } finally {
      setIsTesting(false)
    }
  }

  async function handleCheckNow() {
    setIsChecking(true)
    try {
      await checkNow(monitor.id)
      if (monitor.check_type === 'komari') {
        await loadKomariServers()
      }
      onUpdate()
    } catch (err: any) {
      alert(`检查失败: ${err.message || '请稍后重试'}`)
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="monitor-card">
      <div className="monitor-header">
        <div className="monitor-status" style={{ backgroundColor: statusColor }}>
          <span className="status-dot"></span>
          {statusText}
        </div>
        <div className="monitor-actions">
          <button
            className="btn-icon"
            onClick={handleCheckNow}
            disabled={isChecking}
            title="立即检查"
          >
            {isChecking ? '⏳' : '🔄'}
          </button>
          <button
            className="btn-icon"
            onClick={onEdit}
            title="编辑"
          >
            ✏️
          </button>
          <button
            className="btn-icon"
            onClick={handleDelete}
            disabled={isDeleting}
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>

      <h3 className="monitor-name">{monitor.name}</h3>
      <a
        href={monitor.url}
        target="_blank"
        rel="noopener noreferrer"
        className="monitor-url"
      >
        {monitor.url}
      </a>

      <div className="monitor-stats">
        <div className="stat">
          <span className="stat-label">可用率</span>
          <span className="stat-value">{monitor.uptime?.toFixed(1) || 0}%</span>
        </div>
        <div className="stat">
          <span className="stat-label">响应时间</span>
          <span className="stat-value" style={{
            color: (monitor.latestCheck?.response_time || 0) > 1000 ? '#f59e0b' : 'inherit'
          }}>
            {monitor.latestCheck?.response_time || 0}ms
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">状态码</span>
          <span className="stat-value" style={{
            color: monitor.latestCheck?.status_code && monitor.latestCheck.status_code >= 400 ? '#ef4444' : 'inherit'
          }}>
            {monitor.latestCheck?.status_code || '-'}
          </span>
        </div>
      </div>

      {monitor.check_type === 'komari' && (
        <div className="komari-servers">
          <div className="komari-servers-header">
            <span className="komari-servers-title">服务器状态</span>
            <button
              className="btn-refresh-servers"
              onClick={loadKomariServers}
              disabled={isLoadingServers}
              title="刷新服务器状态"
            >
              {isLoadingServers ? '⏳' : '🔄'}
            </button>
          </div>
          {isLoadingServers ? (
            <div className="komari-loading">加载中...</div>
          ) : komariServers.length > 0 ? (
            <div className="komari-server-list">
              {komariServers.map((server, index) => (
                <div
                  key={index}
                  className={`komari-server-item ${server.is_online ? 'online' : 'offline'}`}
                >
                  <span className="server-indicator"></span>
                  <img
                    src={getFlagUrl(server.region)}
                    alt={server.region}
                    className="server-flag"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span className="server-name">{server.name}</span>
                  <span className="server-time">{server.minutes_ago}分钟前</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="komari-no-servers">无服务器数据</div>
          )}
        </div>
      )}

      {monitor.latestCheck && (
        <div className="monitor-footer">
          <span className="last-check">
            最后检查: {new Date(monitor.latestCheck.checked_at).toLocaleString('zh-CN')}
          </span>
        </div>
      )}

      {monitor.latestCheck?.error_message && status === 'down' && (
        <div className="monitor-error">
          错误: {monitor.latestCheck.error_message}
        </div>
      )}

      <div className="monitor-webhook-test">
        <button
          className="btn-test-webhook"
          onClick={handleTestWebhook}
          disabled={isTesting || !monitor.webhook_url}
          title={!monitor.webhook_url ? '未配置Webhook' : '发送测试通知'}
        >
          {isTesting ? '测试中...' : '测试Webhook'}
        </button>
      </div>
    </div>
  )
}
