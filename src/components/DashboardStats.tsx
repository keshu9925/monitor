import { MonitorWithStatus } from '../App'

interface DashboardStatsProps {
    monitors: MonitorWithStatus[]
}

export default function DashboardStats({ monitors }: DashboardStatsProps) {
    const total = monitors.length
    const up = monitors.filter(m => {
        const status = m.latestCheck?.status
        return status === 'up' || (m.check_type === 'komari' && status !== 'down')
    }).length
    const down = monitors.filter(m => m.latestCheck?.status === 'down').length

    // 计算平均响应时间 (只计算有数据的)
    const responseTimes = monitors
        .map(m => m.latestCheck?.response_time)
        .filter((t): t is number => typeof t === 'number' && t > 0)

    const avgResponseTime = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0

    // 计算平均可用率
    const uptimes = monitors
        .map(m => m.uptime)
        .filter((u): u is number => typeof u === 'number')

    const avgUptime = uptimes.length > 0
        ? (uptimes.reduce((a, b) => a + b, 0) / uptimes.length).toFixed(1)
        : '0.0'

    if (total === 0) return null

    return (
        <div className="dashboard-stats">
            <div className="stat-card">
                <div className="stat-icon total">📊</div>
                <div className="stat-info">
                    <span className="stat-value">{total}</span>
                    <span className="stat-label">总监控</span>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon up">✅</div>
                <div className="stat-info">
                    <span className="stat-value success">{up}</span>
                    <span className="stat-label">运行正常</span>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon down">⚠️</div>
                <div className="stat-info">
                    <span className="stat-value danger">{down}</span>
                    <span className="stat-label">服务故障</span>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon time">⚡</div>
                <div className="stat-info">
                    <span className="stat-value">{avgResponseTime}<small>ms</small></span>
                    <span className="stat-label">平均响应</span>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon uptime">📈</div>
                <div className="stat-info">
                    <span className="stat-value">{avgUptime}<small>%</small></span>
                    <span className="stat-label">平均可用率</span>
                </div>
            </div>
        </div>
    )
}
