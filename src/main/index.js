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
