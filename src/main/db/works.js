import { getDatabase } from './index.js'
import { initializeWorkStructure } from './structure.js'

/**
 * 创建新作品
 * @param {string} name - 作品名称
 * @param {string} description - 作品描述
 * @returns {Object|null} 新建的作品对象
 */
export function createWork(name, description = '') {
  try {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO works (name, description)
      VALUES (?, ?)
    `)
    const result = stmt.run(name, description)
    const workId = result.lastInsertRowid
    
    // 初始化作品结构
    initializeWorkStructure(workId)
    
    return {
      id: workId,
      name,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  } catch (error) {
    console.error('Failed to create work:', error)
    return null
  }
}

/**
 * 获取所有作品
 * @returns {Array} 作品列表
 */
export function getAllWorks() {
  try {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT id, name, description, created_at, updated_at
      FROM works
      ORDER BY updated_at DESC
    `)
    return stmt.all()
  } catch (error) {
    console.error('Failed to get all works:', error)
    return []
  }
}

/**
 * 根据ID获取作品
 * @param {number} id - 作品ID
 * @returns {Object|null} 作品对象
 */
export function getWorkById(id) {
  try {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT id, name, description, created_at, updated_at
      FROM works
      WHERE id = ?
    `)
    return stmt.get(id)
  } catch (error) {
    console.error('Failed to get work:', error)
    return null
  }
}

/**
 * 更新作品
 * @param {number} id - 作品ID
 * @param {string} name - 作品名称
 * @param {string} description - 作品描述
 * @returns {boolean} 是否成功
 */
export function updateWork(id, name, description) {
  try {
    const db = getDatabase()
    const stmt = db.prepare(`
      UPDATE works
      SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    const result = stmt.run(name, description, id)
    return result.changes > 0
  } catch (error) {
    console.error('Failed to update work:', error)
    return false
  }
}

/**
 * 删除作品
 * @param {number} id - 作品ID
 * @returns {boolean} 是否成功
 */
export function deleteWork(id) {
  try {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM works WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  } catch (error) {
    console.error('Failed to delete work:', error)
    return false
  }
}
