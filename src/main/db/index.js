import Database from 'better-sqlite3'
import { join } from 'path'
import { homedir } from 'os'
import { existsSync, mkdirSync, copyFileSync } from 'fs'

let db = null

/**
 * 确保目录存在
 */
function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
}

/**
 * 解析数据库路径（macOS 优先使用 iCloud）
 */
function resolveDbPath() {
  const localDbPath = join(homedir(), 'writer.data')

  // macOS: 优先使用 iCloud Drive
  if (process.platform === 'darwin') {
    const cloudRoot = join(homedir(), 'Library', 'Mobile Documents', 'com~apple~CloudDocs')
    const cloudDir = join(cloudRoot, 'alicia-ai-writer')
    const cloudDbPath = join(cloudDir, 'writer.data')

    // 检查 iCloud Drive 是否可用
    if (existsSync(cloudRoot)) {
      ensureDir(cloudDir)

      // 一次性迁移：如果本地有旧数据库但 iCloud 还没有，则复制过去
      if (!existsSync(cloudDbPath) && existsSync(localDbPath)) {
        try {
          copyFileSync(localDbPath, cloudDbPath)
          console.log('[DB] Migrated local database to iCloud:', cloudDbPath)
        } catch (error) {
          console.error('[DB] Failed to migrate to iCloud, using local path:', error)
          return localDbPath
        }
      }

      console.log('[DB] Using iCloud path:', cloudDbPath)
      return cloudDbPath
    } else {
      console.log('[DB] iCloud Drive not available, using local path')
    }
  }

  console.log('[DB] Using local path:', localDbPath)
  return localDbPath
}

/**
 * 初始化数据库
 */
export function initDatabase() {
  try {
    const dbPath = resolveDbPath()
    
    // 如果数据库文件不存在，better-sqlite3会自动创建
    db = new Database(dbPath)
    
    // 创建设置表
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `)
    
    // 创建作品表
    db.exec(`
      CREATE TABLE IF NOT EXISTS works (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // 创建作品结构表
    db.exec(`
      CREATE TABLE IF NOT EXISTS work_structure (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        work_id INTEGER NOT NULL,
        parent_id INTEGER,
        node_type TEXT NOT NULL,
        title TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES work_structure(id) ON DELETE CASCADE
      )
    `)
    
    // 创建内容表（存储每个节点的实际内容）
    db.exec(`
      CREATE TABLE IF NOT EXISTS node_contents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        node_id INTEGER NOT NULL UNIQUE,
        content TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (node_id) REFERENCES work_structure(id) ON DELETE CASCADE
      )
    `)
    
    // 创建内容版本历史表
    db.exec(`
      CREATE TABLE IF NOT EXISTS content_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        node_id INTEGER NOT NULL,
        version TEXT NOT NULL,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (node_id) REFERENCES work_structure(id) ON DELETE CASCADE
      )
    `)
    
    // 为version查询添加索引
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_content_versions_node_id 
      ON content_versions(node_id)
    `)
    
    // 创建 Prompt 模板表
    db.exec(`
      CREATE TABLE IF NOT EXISTS prompt_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    console.log('Database initialized at:', dbPath)
    return db
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

/**
 * 获取数据库实例
 */
export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

/**
 * 关闭数据库连接
 */
export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}
