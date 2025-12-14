import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // 设置相关API
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
  getAllSettings: () => ipcRenderer.invoke('get-all-settings'),
  
  // 选择文件夹
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  
  // 监听设置页面显示事件
  onShowSettings: (callback) => {
    ipcRenderer.on('show-settings', callback)
    return () => ipcRenderer.removeListener('show-settings', callback)
  },

  // 作品管理API
  createWork: (name, description) => ipcRenderer.invoke('create-work', name, description),
  getAllWorks: () => ipcRenderer.invoke('get-all-works'),
  getWorkById: (id) => ipcRenderer.invoke('get-work-by-id', id),
  updateWork: (id, name, description) => ipcRenderer.invoke('update-work', id, name, description),
  deleteWork: (id) => ipcRenderer.invoke('delete-work', id),

  // 作品结构管理API
  getWorkStructure: (workId) => ipcRenderer.invoke('get-work-structure', workId),
  createNode: (workId, parentId, nodeType, title, sortOrder) =>
    ipcRenderer.invoke('create-node', workId, parentId, nodeType, title, sortOrder),
  updateNodeTitle: (nodeId, title) => ipcRenderer.invoke('update-node-title', nodeId, title),
  deleteNode: (nodeId) => ipcRenderer.invoke('delete-node', nodeId),

  // 内容管理API
  getNodeContent: (nodeId) => ipcRenderer.invoke('get-node-content', nodeId),
  saveNodeContent: (nodeId, content) => ipcRenderer.invoke('save-node-content', nodeId, content),

  // 版本历史API
  getContentVersions: (nodeId) => ipcRenderer.invoke('get-content-versions', nodeId),
  getVersionContent: (nodeId, version) => ipcRenderer.invoke('get-version-content', nodeId, version),
  restoreVersion: (nodeId, version) => ipcRenderer.invoke('restore-version', nodeId, version),

  // AI服务API
  aiGenerateText: (prompt, context) => ipcRenderer.invoke('ai-generate-text', prompt, context),

  // 导出API
  exportNodesToMarkdown: (nodes, workName) => ipcRenderer.invoke('export-nodes-to-markdown', nodes, workName)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
