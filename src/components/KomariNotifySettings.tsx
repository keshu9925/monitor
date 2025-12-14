import { useState, useEffect } from 'react'
import { getKomariNotifySettings, saveKomariNotifySettings, KomariNotifySettings } from '../lib/api'

interface KomariNotifySettingsProps {
    onClose: () => void
}

export default function KomariNotifySettingsComponent({ onClose }: KomariNotifySettingsProps) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState<KomariNotifySettings>({
        enabled: false,
        chat_id: '',
        webhook_url: '',
        webhook_body: ''
    })

    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        try {
            const data = await getKomariNotifySettings()
            setSettings(data)
        } catch (error) {
            console.error('加载配置失败:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        setSaving(true)
        try {
            const result = await saveKomariNotifySettings(settings)
            if (result.success) {
                alert('✅ ' + result.message)
            } else {
                alert('❌ 保存失败')
            }
        } catch (error: any) {
            alert('❌ 保存失败: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>Komari 通知设置</h3>
                        <button className="modal-close" onClick={onClose}>×</button>
                    </div>
                    <div className="modal-body">
                        <p>加载中...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h3>📡 Komari 通知设置</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                checked={settings.enabled}
                                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                            />
                            <strong>启用 Komari 通知接收</strong>
                        </label>
                        <span className="form-hint" style={{ display: 'block', marginTop: '4px' }}>
                            接收 Komari 面板发送的 Webhook 通知
                        </span>
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label htmlFor="komariChatId">TG 通知群组 ID</label>
                        <input
                            id="komariChatId"
                            type="text"
                            value={settings.chat_id}
                            onChange={(e) => setSettings({ ...settings, chat_id: e.target.value })}
                            placeholder="例如: -1001234567890"
                        />
                        <span className="form-hint">
                            收到通知后发送消息到此 TG 群组（需先在顶栏 🤖 配置 Bot Token）
                        </span>
                    </div>

                    <div className="form-group" style={{ marginTop: '20px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                        <strong>📋 配置说明：</strong>
                        <ol style={{ margin: '8px 0 0 20px', lineHeight: '1.8' }}>
                            <li>在 Komari 面板设置 Webhook URL：<code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>https://你的域名/api/komari-notify</code></li>
                            <li>Komari 的 Webhook Body 保持默认即可</li>
                            <li>在下方添加 <strong>Komari 类型监控</strong>，填写"监控目标服务器"和"Webhook 配置"</li>
                            <li>收到离线通知 → 匹配监控项 → 发送 TG 消息 → 调用<strong>该监控项</strong>的 Webhook</li>
                            <li>收到恢复通知 → 仅发送 TG 消息（不调用 Webhook）</li>
                        </ol>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>取消</button>
                    <button className="btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? '保存中...' : '保存配置'}
                    </button>
                </div>
            </div>
        </div>
    )
}
