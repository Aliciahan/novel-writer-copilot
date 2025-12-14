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
 * 生成版本号 YYYYMMDDTHHmmss
 */
function generateVersionId() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const MM = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const HH = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${yyyy}${MM}${dd}T${HH}${mm}${ss}`
}

/**
 * 保存节点内容（自动创建版本历史）
 * @param {number} nodeId - 节点ID
 * @param {string} content - 内容
 * @returns {boolean} 是否成功
 */
export function saveNodeContent(nodeId, content) {
  try {
    const db = getDatabase()
    
    // 获取当前内容（如果存在）
    const currentStmt = db.prepare('SELECT content FROM node_contents WHERE node_id = ?')
    const currentRow = currentStmt.get(nodeId)
    
    // 如果当前有内容，先保存为历史版本
    if (currentRow && currentRow.content !== content) {
      const version = generateVersionId()
      const versionStmt = db.prepare(`
        INSERT INTO content_versions (node_id, version, content)
        VALUES (?, ?, ?)
      `)
      versionStmt.run(nodeId, version, currentRow.content)
      
      // 清理超过10个的旧版本
      const cleanupStmt = db.prepare(`
        DELETE FROM content_versions 
        WHERE node_id = ? AND id NOT IN (
          SELECT id FROM content_versions 
          WHERE node_id = ? 
          ORDER BY created_at DESC 
          LIMIT 10
        )
      `)
      cleanupStmt.run(nodeId, nodeId)
    }
    
    // 保存新内容
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

/**
 * 获取节点的版本历史列表
 * @param {number} nodeId - 节点ID
 * @returns {Array} 版本列表
 */
export function getContentVersions(nodeId) {
  try {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT id, version, created_at, 
             substr(content, 1, 100) as preview
      FROM content_versions 
      WHERE node_id = ? 
      ORDER BY created_at DESC
    `)
    return stmt.all(nodeId)
  } catch (error) {
    console.error('Failed to get content versions:', error)
    return []
  }
}

/**
 * 获取指定版本的内容
 * @param {number} nodeId - 节点ID
 * @param {string} version - 版本号
 * @returns {string|null} 版本内容
 */
export function getVersionContent(nodeId, version) {
  try {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT content FROM content_versions 
      WHERE node_id = ? AND version = ?
    `)
    const row = stmt.get(nodeId, version)
    return row ? row.content : null
  } catch (error) {
    console.error('Failed to get version content:', error)
    return null
  }
}

/**
 * 恢复到指定版本
 * @param {number} nodeId - 节点ID
 * @param {string} version - 版本号
 * @returns {boolean} 是否成功
 */
export function restoreVersion(nodeId, version) {
  try {
    const db = getDatabase()
    
    // 获取历史版本内容
    const versionContent = getVersionContent(nodeId, version)
    if (!versionContent) {
      return false
    }
    
    // 保存当前内容为新版本（恢复前的状态）
    return saveNodeContent(nodeId, versionContent)
  } catch (error) {
    console.error('Failed to restore version:', error)
    return false
  }
}
