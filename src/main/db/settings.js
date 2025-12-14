import { getDatabase } from './index.js'

/**
 * 获取设置项
 * @param {string} key - 设置键
 * @returns {string|null} 设置值
 */
export function getSetting(key) {
  try {
    const db = getDatabase()
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?')
    const row = stmt.get(key)
    return row ? row.value : null
  } catch (error) {
    console.error('Failed to get setting:', error)
    return null
  }
}

/**
 * 设置配置项
 * @param {string} key - 设置键
 * @param {string} value - 设置值
 * @returns {boolean} 是否成功
 */
export function setSetting(key, value) {
  try {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `)
    stmt.run(key, value)
    return true
  } catch (error) {
    console.error('Failed to set setting:', error)
    return false
  }
}

/**
 * 删除设置项
 * @param {string} key - 设置键
 * @returns {boolean} 是否成功
 */
export function deleteSetting(key) {
  try {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM settings WHERE key = ?')
    stmt.run(key)
    return true
  } catch (error) {
    console.error('Failed to delete setting:', error)
    return false
  }
}

/**
 * 获取所有设置
 * @returns {Object} 所有设置的键值对
 */
export function getAllSettings() {
  try {
    const db = getDatabase()
    const stmt = db.prepare('SELECT key, value FROM settings')
    const rows = stmt.all()
    const settings = {}
    rows.forEach((row) => {
      settings[row.key] = row.value
    })
    return settings
  } catch (error) {
    console.error('Failed to get all settings:', error)
    return {}
  }
}
