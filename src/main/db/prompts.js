import { getDatabase } from './index.js'

/**
 * 获取所有 Prompt 模板
 */
export function getAllPrompts() {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM prompt_templates ORDER BY created_at DESC')
  return stmt.all()
}

/**
 * 获取单个 Prompt 模板
 */
export function getPrompt(id) {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM prompt_templates WHERE id = ?')
  return stmt.get(id)
}

/**
 * 创建 Prompt 模板
 */
export function createPrompt(name, content) {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO prompt_templates (name, content)
    VALUES (?, ?)
  `)
  const result = stmt.run(name, content)
  return result.lastInsertRowid
}

/**
 * 更新 Prompt 模板
 */
export function updatePrompt(id, name, content) {
  const db = getDatabase()
  const stmt = db.prepare(`
    UPDATE prompt_templates 
    SET name = ?, content = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  const result = stmt.run(name, content, id)
  return result.changes > 0
}

/**
 * 删除 Prompt 模板
 */
export function deletePrompt(id) {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM prompt_templates WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}
