import { join } from 'path'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'

/**
 * 确保目录存在
 * @param {string} dirPath - 目录路径
 */
export function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
}

/**
 * 写入文件
 * @param {string} filePath - 文件路径
 * @param {string} content - 内容
 * @returns {boolean} 是否成功
 */
export function writeFile(filePath, content) {
  try {
    writeFileSync(filePath, content, 'utf-8')
    return true
  } catch (error) {
    console.error('Failed to write file:', error)
    return false
  }
}

/**
 * 读取文件
 * @param {string} filePath - 文件路径
 * @returns {string|null} 文件内容
 */
export function readFile(filePath) {
  try {
    if (!existsSync(filePath)) {
      return null
    }
    return readFileSync(filePath, 'utf-8')
  } catch (error) {
    console.error('Failed to read file:', error)
    return null
  }
}

/**
 * 获取作品的输出目录
 * @param {string} outputFolder - 输出根目录
 * @param {string} workName - 作品名称
 * @returns {string} 作品目录路径
 */
export function getWorkDirectory(outputFolder, workName) {
  return join(outputFolder, workName)
}

/**
 * 初始化作品目录结构
 * @param {string} outputFolder - 输出根目录
 * @param {string} workName - 作品名称
 * @returns {boolean} 是否成功
 */
export function initializeWorkDirectory(outputFolder, workName) {
  try {
    const workDir = getWorkDirectory(outputFolder, workName)
    
    // 创建主目录
    ensureDir(workDir)
    
    // 创建子目录
    const dirs = [
      '作品设定',
      '作品设定/世界设定',
      '作品设定/人物设定',
      '作品设定/写作建议设定',
      '作品设定/整体大纲',
      '作品简介',
      '随便聊聊',
      '作品正文'
    ]
    
    for (const dir of dirs) {
      ensureDir(join(workDir, dir))
    }
    
    return true
  } catch (error) {
    console.error('Failed to initialize work directory:', error)
    return false
  }
}
