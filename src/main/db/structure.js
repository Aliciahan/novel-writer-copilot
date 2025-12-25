import { getDatabase } from './index.js'

/**
 * 节点类型枚举
 */
export const NodeType = {
  // 作品设定
  WORK_SETTINGS: 'work_settings',
  WORLD_SETTINGS: 'world_settings',
  CHARACTER_SETTINGS: 'character_settings',
  WRITING_ADVICE: 'writing_advice',
  OVERALL_OUTLINE: 'overall_outline',
  
  // 作品简介
  WORK_INTRO: 'work_intro',
  
  // 随便聊聊
  CHAT: 'chat',
  
  // 作品正文
  WORK_CONTENT: 'work_content',
  VOLUME: 'volume',
  VOLUME_OUTLINE: 'volume_outline',
  VOLUME_SUMMARY: 'volume_summary',
  VOLUME_CONTENT: 'volume_content',
  CHAPTER: 'chapter',
  CHAPTER_OUTLINE: 'chapter_outline',
  CHAPTER_CONTENT: 'chapter_content',
  CHAPTER_CONTEXT: 'chapter_context'
}

/**
 * 获取作品的树形结构
 * @param {number} workId - 作品ID
 * @returns {Array} 树形结构数据
 */
export function getWorkStructure(workId) {
  try {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT 
        ws.id, 
        ws.work_id, 
        ws.parent_id, 
        ws.node_type, 
        ws.title, 
        ws.sort_order,
        nc.content,
        CASE 
          WHEN nc.content IS NOT NULL AND LENGTH(TRIM(nc.content)) > 0 
          THEN 1 
          ELSE 0 
        END as has_content
      FROM work_structure ws
      LEFT JOIN node_contents nc ON ws.id = nc.node_id
      WHERE ws.work_id = ?
      ORDER BY ws.parent_id, ws.sort_order
    `)
    const nodes = stmt.all(workId)
    return buildTree(nodes)
  } catch (error) {
    console.error('Failed to get work structure:', error)
    return []
  }
}

/**
 * 构建树形结构
 */
function buildTree(nodes, parentId = null) {
  const tree = []
  for (const node of nodes) {
    if (node.parent_id === parentId) {
      const children = buildTree(nodes, node.id)
      
      // 提取内容预览（前10个字符）
      let contentPreview = ''
      if (node.content && node.content.trim()) {
        const trimmed = node.content.trim()
        contentPreview = trimmed.substring(0, 10)
      }
      
      tree.push({
        key: `${node.id}`,
        title: node.title,
        nodeType: node.node_type,
        id: node.id,
        hasContent: node.has_content === 1,
        contentPreview: contentPreview,
        children: children.length > 0 ? children : undefined
      })
    }
  }
  return tree
}

/**
 * 创建节点
 * @param {number} workId - 作品ID
 * @param {number} parentId - 父节点ID
 * @param {string} nodeType - 节点类型
 * @param {string} title - 标题
 * @param {number} sortOrder - 排序
 * @returns {Object|null} 新节点
 */
export function createNode(workId, parentId, nodeType, title, sortOrder = 0) {
  try {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO work_structure (work_id, parent_id, node_type, title, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = stmt.run(workId, parentId, nodeType, title, sortOrder)
    return {
      id: result.lastInsertRowid,
      work_id: workId,
      parent_id: parentId,
      node_type: nodeType,
      title,
      sort_order: sortOrder
    }
  } catch (error) {
    console.error('Failed to create node:', error)
    return null
  }
}

/**
 * 更新节点标题
 * @param {number} nodeId - 节点ID
 * @param {string} title - 新标题
 * @returns {boolean} 是否成功
 */
export function updateNodeTitle(nodeId, title) {
  try {
    const db = getDatabase()
    const stmt = db.prepare(`
      UPDATE work_structure
      SET title = ?
      WHERE id = ?
    `)
    const result = stmt.run(title, nodeId)
    return result.changes > 0
  } catch (error) {
    console.error('Failed to update node title:', error)
    return false
  }
}

/**
 * 删除节点（包括子节点）
 * @param {number} nodeId - 节点ID
 * @returns {boolean} 是否成功
 */
export function deleteNode(nodeId) {
  try {
    const db = getDatabase()
    // 递归删除子节点
    const getChildren = db.prepare('SELECT id FROM work_structure WHERE parent_id = ?')
    const children = getChildren.all(nodeId)
    
    for (const child of children) {
      deleteNode(child.id)
    }
    
    // 删除当前节点
    const stmt = db.prepare('DELETE FROM work_structure WHERE id = ?')
    const result = stmt.run(nodeId)
    return result.changes > 0
  } catch (error) {
    console.error('Failed to delete node:', error)
    return false
  }
}

/**
 * 初始化作品结构
 * @param {number} workId - 作品ID
 * @returns {boolean} 是否成功
 */
export function initializeWorkStructure(workId) {
  try {
    const db = getDatabase()
    
    const insertStmt = db.prepare(`
      INSERT INTO work_structure (work_id, parent_id, node_type, title, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `)
    
    // 1. 作品设定 (根节点)
    const settingsResult = insertStmt.run(workId, null, NodeType.WORK_SETTINGS, '作品设定', 1)
    const settingsId = settingsResult.lastInsertRowid
    
    // 作品设定的子节点
    insertStmt.run(workId, settingsId, NodeType.WORLD_SETTINGS, '世界设定', 1)
    insertStmt.run(workId, settingsId, NodeType.CHARACTER_SETTINGS, '人物设定', 2)
    insertStmt.run(workId, settingsId, NodeType.WRITING_ADVICE, '写作建议设定', 3)
    insertStmt.run(workId, settingsId, NodeType.OVERALL_OUTLINE, '整体大纲', 4)
    
    // 2. 作品简介
    insertStmt.run(workId, null, NodeType.WORK_INTRO, '作品简介', 2)
    
    // 3. 随便聊聊
    insertStmt.run(workId, null, NodeType.CHAT, '随便聊聊', 3)
    
    // 4. 作品正文 (根节点)
    const contentResult = insertStmt.run(workId, null, NodeType.WORK_CONTENT, '作品正文', 4)
    const contentId = contentResult.lastInsertRowid
    
    // 默认创建卷1
    const volume1Result = insertStmt.run(workId, contentId, NodeType.VOLUME, '卷1', 1)
    const volume1Id = volume1Result.lastInsertRowid
    
    // 卷1的子节点
    insertStmt.run(workId, volume1Id, NodeType.VOLUME_OUTLINE, '本卷大纲', 1)
    insertStmt.run(workId, volume1Id, NodeType.VOLUME_SUMMARY, '本卷总结', 2)
    
    // 本卷正文节点
    const volumeContentResult = insertStmt.run(workId, volume1Id, NodeType.VOLUME_CONTENT, '本卷正文', 3)
    const volumeContentId = volumeContentResult.lastInsertRowid
    
    // 默认创建章节1
    const chapter1Result = insertStmt.run(workId, volumeContentId, NodeType.CHAPTER, '正文章节1', 1)
    const chapter1Id = chapter1Result.lastInsertRowid
    
    // 章节1的子节点
    insertStmt.run(workId, chapter1Id, NodeType.CHAPTER_OUTLINE, '写作细纲', 1)
    insertStmt.run(workId, chapter1Id, NodeType.CHAPTER_CONTENT, '正文', 2)
    insertStmt.run(workId, chapter1Id, NodeType.CHAPTER_CONTEXT, '上下文总结Context', 3)
    
    return true
  } catch (error) {
    console.error('Failed to initialize work structure:', error)
    return false
  }
}
