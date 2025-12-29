import { app, shell, BrowserWindow, ipcMain, Menu, dialog } from 'electron'
import { join } from 'path'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase, closeDatabase } from './db/index.js'
import { getSetting, setSetting, getAllSettings } from './db/settings.js'
import { createWork, getAllWorks, getWorkById, updateWork, deleteWork } from './db/works.js'
import {
  getWorkStructure,
  createNode,
  updateNodeTitle,
  deleteNode
} from './db/structure.js'
import { 
  getNodeContent, 
  saveNodeContent, 
  getContentVersions, 
  getVersionContent, 
  restoreVersion 
} from './db/contents.js'
import { 
  getAllPrompts, 
  getPrompt, 
  createPrompt, 
  updatePrompt, 
  deletePrompt 
} from './db/prompts.js'
import { generateText } from './services/aiService.js'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // 创建菜单
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Settings',
          click: () => {
            mainWindow.webContents.send('show-settings')
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 添加右键菜单支持
  mainWindow.webContents.on('context-menu', (event, params) => {
    const { editFlags, selectionText } = params
    const { canCut, canCopy, canPaste, canSelectAll, canUndo, canRedo } = editFlags

    const menuTemplate = []

    if (canUndo) {
      menuTemplate.push({ label: '撤销', role: 'undo' })
    }
    if (canRedo) {
      menuTemplate.push({ label: '重做', role: 'redo' })
    }
    if (canUndo || canRedo) {
      menuTemplate.push({ type: 'separator' })
    }

    if (canCut) {
      menuTemplate.push({ label: '剪切', role: 'cut' })
    }
    if (canCopy) {
      menuTemplate.push({ label: '复制', role: 'copy' })
    }
    if (canPaste) {
      menuTemplate.push({ label: '粘贴', role: 'paste' })
    }
    if (canSelectAll) {
      if (menuTemplate.length > 0) {
        menuTemplate.push({ type: 'separator' })
      }
      menuTemplate.push({ label: '全选', role: 'selectAll' })
    }

    if (menuTemplate.length > 0) {
      const contextMenu = Menu.buildFromTemplate(menuTemplate)
      contextMenu.popup({ window: mainWindow })
    }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // 初始化数据库
  initDatabase()

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC handlers for settings
  ipcMain.handle('get-setting', async (event, key) => {
    return getSetting(key)
  })

  ipcMain.handle('set-setting', async (event, key, value) => {
    return setSetting(key, value)
  })

  ipcMain.handle('get-all-settings', async () => {
    return getAllSettings()
  })

  // 选择文件夹对话框
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  // 作品管理 IPC handlers
  ipcMain.handle('create-work', async (event, name, description) => {
    return createWork(name, description)
  })

  ipcMain.handle('get-all-works', async () => {
    return getAllWorks()
  })

  ipcMain.handle('get-work-by-id', async (event, id) => {
    return getWorkById(id)
  })

  ipcMain.handle('update-work', async (event, id, name, description) => {
    return updateWork(id, name, description)
  })

  ipcMain.handle('delete-work', async (event, id) => {
    return deleteWork(id)
  })

  // 作品结构管理 IPC handlers
  ipcMain.handle('get-work-structure', async (event, workId) => {
    return getWorkStructure(workId)
  })

  ipcMain.handle('create-node', async (event, workId, parentId, nodeType, title, sortOrder) => {
    return createNode(workId, parentId, nodeType, title, sortOrder)
  })

  ipcMain.handle('update-node-title', async (event, nodeId, title) => {
    return updateNodeTitle(nodeId, title)
  })

  ipcMain.handle('delete-node', async (event, nodeId) => {
    return deleteNode(nodeId)
  })

  // 内容管理 IPC handlers
  ipcMain.handle('get-node-content', async (event, nodeId) => {
    return getNodeContent(nodeId)
  })

  ipcMain.handle('save-node-content', async (event, nodeId, content) => {
    return saveNodeContent(nodeId, content)
  })

  // 版本历史 IPC handlers
  ipcMain.handle('get-content-versions', async (event, nodeId) => {
    return getContentVersions(nodeId)
  })

  ipcMain.handle('get-version-content', async (event, nodeId, version) => {
    return getVersionContent(nodeId, version)
  })

  ipcMain.handle('restore-version', async (event, nodeId, version) => {
    return restoreVersion(nodeId, version)
  })

  // Prompt 模板 IPC handlers
  ipcMain.handle('get-all-prompts', async () => {
    return getAllPrompts()
  })

  ipcMain.handle('get-prompt', async (event, id) => {
    return getPrompt(id)
  })

  ipcMain.handle('create-prompt', async (event, name, content) => {
    return createPrompt(name, content)
  })

  ipcMain.handle('update-prompt', async (event, id, name, content) => {
    return updatePrompt(id, name, content)
  })

  ipcMain.handle('delete-prompt', async (event, id) => {
    return deletePrompt(id)
  })

  // AI服务 IPC handlers
  ipcMain.handle('ai-generate-text', async (event, prompt, context) => {
    try {
      return await generateText(prompt, context)
    } catch (error) {
      console.error('AI generation failed:', error)
      throw error
    }
  })

  // 导出节点内容到Markdown文件
  ipcMain.handle('export-nodes-to-markdown', async (event, nodes, workName) => {
    try {
      const outputFolder = await getSetting('outputFolder')
      if (!outputFolder) {
        throw new Error('请先在设置中配置输出文件夹')
      }

      // 确保输出文件夹存在
      if (!existsSync(outputFolder)) {
        mkdirSync(outputFolder, { recursive: true })
      }

      // 生成文件名 YYYY-MM-DDTHH-mm-ss.md
      const now = new Date()
      const filename = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}.md`
      const filePath = join(outputFolder, filename)

      // 构建 Markdown 内容
      let markdown = `# ${workName}\n\n`
      markdown += `> 导出时间: ${now.toLocaleString('zh-CN')}\n\n`
      markdown += `---\n\n`

      for (const node of nodes) {
        markdown += `## ${node.title}\n\n`
        markdown += `${node.content || '(无内容)'}\n\n`
        markdown += `---\n\n`
      }

      // 写入文件
      writeFileSync(filePath, markdown, 'utf-8')
      
      return { success: true, filePath }
    } catch (error) {
      console.error('Export to markdown failed:', error)
      throw error
    }
  })

  // 导出节点到TXT
  ipcMain.handle('export-nodes-to-text', async (event, nodes, workName) => {
    try {
      const outputFolder = await getSetting('outputFolder')
      if (!outputFolder) {
        throw new Error('请先在设置中配置输出文件夹')
      }

      // 确保输出文件夹存在
      if (!existsSync(outputFolder)) {
        mkdirSync(outputFolder, { recursive: true })
      }

      // 生成文件名 YYYY-MM-DDTHH-mm-ss.txt
      const now = new Date()
      const filename = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}.txt`
      const filePath = join(outputFolder, filename)

      // 构建 TXT 内容
      let text = `${workName}\n`
      text += `导出时间: ${now.toLocaleString('zh-CN')}\n`
      text += `${'='.repeat(50)}\n\n`

      for (const node of nodes) {
        text += `${node.title}\n`
        text += `${'-'.repeat(30)}\n`
        text += `${node.content || '(无内容)'}\n\n`
      }

      // 写入文件
      writeFileSync(filePath, text, 'utf-8')
      
      return { success: true, filePath }
    } catch (error) {
      console.error('Export to text failed:', error)
      throw error
    }
  })

  // MacOS TTS 朗读功能
  let ttsProcess = null
  
  ipcMain.handle('tts-speak', async (event, text) => {
    try {
      // 只在 MacOS 上支持
      if (process.platform !== 'darwin') {
        throw new Error('朗读功能仅支持 MacOS')
      }

      // 如果正在朗读，先停止
      if (ttsProcess) {
        ttsProcess.kill()
        ttsProcess = null
      }

      if (!text || text.trim().length === 0) {
        return { success: false, message: '没有可朗读的内容' }
      }

      // 使用 MacOS 的 say 命令进行朗读
      const { spawn } = require('child_process')
      // 使用中文语音 Tingting (简体中文)
      ttsProcess = spawn('say', ['-v', 'Tingting', text], {
        encoding: 'utf8',
        env: { ...process.env, LANG: 'zh_CN.UTF-8' }
      })

      ttsProcess.on('error', (error) => {
        console.error('TTS error:', error)
        ttsProcess = null
      })

      ttsProcess.on('exit', () => {
        ttsProcess = null
      })

      return { success: true }
    } catch (error) {
      console.error('TTS speak failed:', error)
      throw error
    }
  })

  ipcMain.handle('tts-stop', async () => {
    try {
      if (ttsProcess) {
        ttsProcess.kill()
        ttsProcess = null
      }
      return { success: true }
    } catch (error) {
      console.error('TTS stop failed:', error)
      throw error
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 关闭数据库连接
app.on('before-quit', () => {
  closeDatabase()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
