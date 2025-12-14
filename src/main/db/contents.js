import { getDatabase } from './index.js'

/**
 * 获取节点内容
 * @param {number} nodeId - 节点ID
 * @returns {string|null} 内容
 */
export function getNodeContent(nodeId) {
  try {
    const db = getDatabase()
    const stmt = db.prepare('SELECT content FROM node_contents WHERE node_id = ?')
    const row = stmt.get(nodeId)
    return row ? row.content : ''
  } catch (error) {
    console.error('Failed to get node content:', error)
    return null
  }
}

/**
 * 保存节点内容
 * @param {number} nodeId - 节点ID
 * @param {string} content - 内容
 * @returns {boolean} 是否成功
 */
export function saveNodeContent(nodeId, content) {
  try {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO node_contents (node_id, content, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(node_id) DO UPDATE SET 
        content = excluded.content,
        updated_at = CURRENT_TIMESTAMP
    `)
    stmt.run(nodeId, content)
    return true
  } catch (error) {
    console.error('Failed to save node content:', error)
    return false
  }
}
