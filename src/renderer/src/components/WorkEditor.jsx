import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Layout, Tree, Spin, message, Button, Input, Dropdown, Card, Space, Modal, List, Typography } from 'antd'
import {
  ArrowLeftOutlined,
  FolderOutlined,
  FileOutlined,
  PlusOutlined,
  EllipsisOutlined,
  SendOutlined,
  RobotOutlined,
  ExportOutlined,
  HistoryOutlined
} from '@ant-design/icons'
const { Sider, Content } = Layout
const { TextArea } = Input
const { Text } = Typography

// 懒加载 tiktoken encoder
let encoder = null
const getEncoder = async () => {
  if (!encoder) {
    try {
      const { encoding_for_model } = await import('@dqbd/tiktoken')
      encoder = encoding_for_model('gpt-4')
    } catch (error) {
      console.error('Failed to initialize tiktoken encoder:', error)
    }
  }
  return encoder
}

function WorkEditor({ workId, workName, onBack }) {
  const [treeData, setTreeData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState(null)
  const [content, setContent] = useState('')
  const [contentLoading, setContentLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [checkedKeys, setCheckedKeys] = useState([])
  const [estimatedTokens, setEstimatedTokens] = useState(0)
  const [contentChanged, setContentChanged] = useState(false)
  const [originalContent, setOriginalContent] = useState('')
  const [versionModalVisible, setVersionModalVisible] = useState(false)
  const [versions, setVersions] = useState([])
  const [loadingVersions, setLoadingVersions] = useState(false)

  const loadWorkStructure = async () => {
    setLoading(true)
    try {
      const structure = await window.api.getWorkStructure(workId)
      setTreeData(structure)
      
      // 加载保存的勾选状态
      const savedCheckedKeys = await window.api.getSetting(`work_${workId}_checked_nodes`)
      if (savedCheckedKeys) {
        try {
          const parsed = JSON.parse(savedCheckedKeys)
          setCheckedKeys(parsed)
          console.debug('Loaded checked keys for work:', workId, parsed)
        } catch (error) {
          console.error('Failed to parse saved checked keys:', error)
        }
      }
    } catch (error) {
      console.error('Failed to load work structure:', error)
      message.error('加载作品结构失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载作品结构
  useEffect(() => {
    if (workId) {
      loadWorkStructure()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workId])

  // 实际加载节点内容
  const loadNodeContent = async (nodeId, node) => {
    setContentLoading(true)
    try {
      const nodeContent = await window.api.getNodeContent(nodeId)
      setContent(nodeContent || '')
      setOriginalContent(nodeContent || '')
      setContentChanged(false)
      setSelectedNode(node)
    } catch (error) {
      console.error('Failed to load node content:', error)
      message.error('加载内容失败')
    } finally {
      setContentLoading(false)
    }
  }

  // 选择节点
  const handleSelect = async (selectedKeys, info) => {
    if (selectedKeys.length === 0) return

    const nodeId = parseInt(selectedKeys[0])

    // 如果当前有未保存的修改，提示用户
    if (contentChanged && selectedNode) {
      Modal.confirm({
        title: '未保存的修改',
        content: '当前内容已修改但未保存，是否保存后再切换？',
        okText: '保存并切换',
        cancelText: '不保存',
        onOk: async () => {
          try {
            const currentNodeId = parseInt(selectedNode.key)
            await window.api.saveNodeContent(currentNodeId, content)
            message.success('保存成功')
            await loadNodeContent(nodeId, info.node)
          } catch (error) {
            console.error('Failed to save content:', error)
            message.error('保存失败')
          }
        },
        onCancel: async () => {
          await loadNodeContent(nodeId, info.node)
        }
      })
    } else {
      await loadNodeContent(nodeId, info.node)
    }
  }

  // 处理树节点勾选
  const handleCheck = async (checkedKeysValue) => {
    console.debug('Tree checked keys:', checkedKeysValue)
    setCheckedKeys(checkedKeysValue)
    
    // 保存勾选状态到数据库
    try {
      await window.api.setSetting(`work_${workId}_checked_nodes`, JSON.stringify(checkedKeysValue))
      console.debug('Saved checked keys for work:', workId)
    } catch (error) {
      console.error('Failed to save checked keys:', error)
    }
  }

  // 使用 tiktoken 精确计算 Token 数量
  const estimateTokens = async (text) => {
    if (!text) {
      return 0
    }
    try {
      const enc = await getEncoder()
      if (enc) {
        const tokens = enc.encode(text)
        return tokens.length
      }
    } catch (error) {
      console.error('Token encoding error:', error)
    }
    // 降级到简单估算
    return Math.ceil(text.length / 4)
  }

  // 获取勾选节点的内容并格式化
  const getCheckedNodesContext = async () => {
    if (checkedKeys.length === 0) {
      return ''
    }

    const contextParts = []
    
    // 递归查找所有节点
    const findNodeById = (nodes, id) => {
      for (const node of nodes) {
        if (node.key === id.toString()) return node
        if (node.children) {
          const found = findNodeById(node.children, id)
          if (found) return found
        }
      }
      return null
    }

    for (const key of checkedKeys) {
      const nodeId = parseInt(key)
      const node = findNodeById(treeData, nodeId)
      
      if (node) {
        try {
          const nodeContent = await window.api.getNodeContent(nodeId)
          if (nodeContent && nodeContent.trim()) {
            contextParts.push(`---\nSection: ${node.title}\nContent: |-\n${nodeContent}\n`)
          }
        } catch (error) {
          console.error(`Failed to load content for node ${nodeId}:`, error)
        }
      }
    }

    return contextParts.join('\n')
  }

  // 保存内容
  const handleSaveContent = async () => {
    if (!selectedNode) return

    setSaving(true)
    try {
      const nodeId = parseInt(selectedNode.key)
      const success = await window.api.saveNodeContent(nodeId, content)
      if (success) {
        message.success('保存成功')
        setOriginalContent(content)
        setContentChanged(false)
      } else {
        message.error('保存失败')
      }
    } catch (error) {
      console.error('Failed to save content:', error)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 导出选中节点到Markdown
  const handleExportToMarkdown = async () => {
    if (checkedKeys.length === 0) {
      message.warning('请先勾选要导出的节点')
      return
    }

    try {
      // 递归查找所有节点
      const findNodeById = (nodes, id) => {
        for (const node of nodes) {
          if (node.key === id.toString()) return node
          if (node.children) {
            const found = findNodeById(node.children, id)
            if (found) return found
          }
        }
        return null
      }

      // 收集所有勾选节点的内容
      const nodesToExport = []
      for (const key of checkedKeys) {
        const nodeId = parseInt(key)
        const node = findNodeById(treeData, nodeId)
        
        if (node) {
          const nodeContent = await window.api.getNodeContent(nodeId)
          nodesToExport.push({
            title: node.title,
            content: nodeContent || ''
          })
        }
      }

      const result = await window.api.exportNodesToMarkdown(nodesToExport, workName)
      
      if (result.success) {
        message.success(`导出成功: ${result.filePath}`)
        console.debug('Exported to:', result.filePath)
      }
    } catch (error) {
      console.error('Export failed:', error)
      if (error.message && error.message.includes('输出文件夹')) {
        message.error('请先在设置中配置输出文件夹')
      } else {
        message.error('导出失败: ' + (error.message || '未知错误'))
      }
    }
  }

  // 显示版本历史
  const handleShowVersions = async () => {
    if (!selectedNode) return

    setVersionModalVisible(true)
    setLoadingVersions(true)

    try {
      const nodeId = parseInt(selectedNode.key)
      const versionList = await window.api.getContentVersions(nodeId)
      setVersions(versionList)
      console.debug('Loaded versions:', versionList)
    } catch (error) {
      console.error('Failed to load versions:', error)
      message.error('加载版本历史失败')
    } finally {
      setLoadingVersions(false)
    }
  }

  // 恢复到指定版本
  const handleRestoreVersion = async (version) => {
    if (!selectedNode) return

    Modal.confirm({
      title: '确认恢复版本',
      content: `确定要恢复到版本 ${version} 吗？当前未保存的修改将会丢失。`,
      okText: '确认恢复',
      cancelText: '取消',
      onOk: async () => {
        try {
          const nodeId = parseInt(selectedNode.key)
          const success = await window.api.restoreVersion(nodeId, version)
          
          if (success) {
            // 重新加载内容
            const nodeContent = await window.api.getNodeContent(nodeId)
            setContent(nodeContent || '')
            setOriginalContent(nodeContent || '')
            setContentChanged(false)
            message.success('版本恢复成功')
            setVersionModalVisible(false)
          } else {
            message.error('版本恢复失败')
          }
        } catch (error) {
          console.error('Failed to restore version:', error)
          message.error('版本恢复失败')
        }
      }
    })
  }

  // 预览版本内容
  const handlePreviewVersion = async (version) => {
    if (!selectedNode) return

    try {
      const nodeId = parseInt(selectedNode.key)
      const versionContent = await window.api.getVersionContent(nodeId, version)
      
      Modal.info({
        title: `版本 ${version} 预览`,
        width: 800,
        content: (
          <div style={{ maxHeight: '500px', overflow: 'auto' }}>
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {versionContent}
            </pre>
          </div>
        ),
        okText: '关闭'
      })
    } catch (error) {
      console.error('Failed to preview version:', error)
      message.error('加载版本内容失败')
    }
  }

  // AI生成文本
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      message.warning('请输入提示词')
      return
    }

    setAiGenerating(true)
    try {
      // 获取勾选节点的上下文
      const checkedContext = await getCheckedNodesContext()
      
      // 构建完整上下文：当前内容 + 选中节点内容
      let fullContext = content
      if (checkedContext) {
        fullContext = fullContext + '\n\n===== 参考内容 =====\n' + checkedContext
      }

      // 估算Token
      const promptTokens = await estimateTokens(aiPrompt)
      const contextTokens = await estimateTokens(fullContext)
      const totalTokens = promptTokens + contextTokens
      
      console.debug('AI Request:', {
        prompt: aiPrompt,
        contextLength: fullContext.length,
        checkedNodesCount: checkedKeys.length,
        estimatedTokens: totalTokens
      })

      const response = await window.api.aiGenerateText(aiPrompt, fullContext)
      
      console.debug('AI Response:', {
        responseLength: response.length,
        estimatedResponseTokens: await estimateTokens(response)
      })

      // 将AI响应追加到当前内容
      setContent((prev) => {
        if (prev.trim()) {
          return prev + '\n\n' + response
        }
        return response
      })
      message.success('AI内容生成成功')
      setAiPrompt('') // 清空输入框
      setEstimatedTokens(0) // 重置Token估算
    } catch (error) {
      console.error('AI generation failed:', error)
      if (error.message && error.message.includes('Google API Key')) {
        message.error('请先在设置中配置Google API Key')
      } else {
        message.error('AI生成失败: ' + (error.message || '未知错误'))
      }
    } finally {
      setAiGenerating(false)
    }
  }

  // 更新Token估算（当输入或选择改变时）
  useEffect(() => {
    const updateTokenEstimate = async () => {
      if (!aiPrompt && checkedKeys.length === 0) {
        setEstimatedTokens(0)
        return
      }

      const checkedContext = await getCheckedNodesContext()
      const fullContext = content + (checkedContext ? '\n\n===== 参考内容 =====\n' + checkedContext : '')
      const promptTokens = await estimateTokens(aiPrompt)
      const contextTokens = await estimateTokens(fullContext)
      setEstimatedTokens(promptTokens + contextTokens)
    }

    updateTokenEstimate()
  }, [aiPrompt, checkedKeys, content])

  // 添加卷
  const handleAddVolume = async (parentId) => {
    try {
      const volumeCount = treeData.find((node) => node.title === '作品正文')?.children?.length || 0
      const newVolumeName = `卷${volumeCount + 1}`

      const newNode = await window.api.createNode(
        workId,
        parentId,
        'volume',
        newVolumeName,
        volumeCount + 1
      )

      if (newNode) {
        // 创建卷的子节点
        await window.api.createNode(workId, newNode.id, 'volume_outline', '本卷大纲', 1)
        await window.api.createNode(workId, newNode.id, 'volume_summary', '本卷总结', 2)
        const volumeContent = await window.api.createNode(
          workId,
          newNode.id,
          'volume_content',
          '本卷正文',
          3
        )

        // 创建默认章节
        if (volumeContent) {
          const chapter = await window.api.createNode(
            workId,
            volumeContent.id,
            'chapter',
            '正文章节1',
            1
          )
          if (chapter) {
            await window.api.createNode(workId, chapter.id, 'chapter_outline', '写作细纲', 1)
            await window.api.createNode(workId, chapter.id, 'chapter_content', '正文', 2)
            await window.api.createNode(workId, chapter.id, 'chapter_context', '上下文总结Context', 3)
          }
        }

        message.success('卷添加成功')
        await loadWorkStructure()
      } else {
        message.error('添加卷失败')
      }
    } catch (error) {
      console.error('Failed to add volume:', error)
      message.error('添加卷失败')
    }
  }

  // 添加章节
  const handleAddChapter = async (parentId) => {
    try {
      // 获取当前章节数量
      const volumeContentNode = findNodeById(treeData, parentId)
      const chapterCount = volumeContentNode?.children?.length || 0
      const newChapterName = `正文章节${chapterCount + 1}`

      const newChapter = await window.api.createNode(
        workId,
        parentId,
        'chapter',
        newChapterName,
        chapterCount + 1
      )

      if (newChapter) {
        // 创建章节的子节点
        await window.api.createNode(workId, newChapter.id, 'chapter_outline', '写作细纲', 1)
        await window.api.createNode(workId, newChapter.id, 'chapter_content', '正文', 2)
        await window.api.createNode(workId, newChapter.id, 'chapter_context', '上下文总结Context', 3)

        message.success('章节添加成功')
        await loadWorkStructure()
      } else {
        message.error('添加章节失败')
      }
    } catch (error) {
      console.error('Failed to add chapter:', error)
      message.error('添加章节失败')
    }
  }

  // 查找节点
  const findNodeById = (nodes, id) => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children) {
        const found = findNodeById(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  // 渲染树节点图标
  const renderTreeIcon = ({ isLeaf }) => {
    return isLeaf ? <FileOutlined /> : <FolderOutlined />
  }

  // 获取节点操作菜单项
  const getNodeMenuItems = (nodeData) => {
    const items = []

    // 作品正文节点可以添加卷
    if (nodeData.title === '作品正文') {
      items.push({
        key: 'add-volume',
        label: '添加新卷',
        icon: <PlusOutlined />,
        onClick: () => handleAddVolume(nodeData.id)
      })
    }

    // 本卷正文节点可以添加章节
    if (nodeData.title === '本卷正文') {
      items.push({
        key: 'add-chapter',
        label: '添加新章节',
        icon: <PlusOutlined />,
        onClick: () => handleAddChapter(nodeData.id)
      })
    }

    return items
  }

  // 使用titleRender自定义节点标题
  const titleRender = (nodeData) => {
    const menuItems = getNodeMenuItems(nodeData)

    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'calc(100% - 24px)',
          minWidth: 0
        }}
      >
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0
          }}
        >
          {nodeData.title}
        </span>
        {menuItems.length > 0 && (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              size="small"
              icon={<EllipsisOutlined />}
              onClick={(e) => {
                e.stopPropagation()
              }}
              style={{ marginLeft: '8px', flexShrink: 0 }}
            />
          </Dropdown>
        )}
      </div>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={280}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          overflow: 'auto'
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            style={{ marginBottom: '12px' }}
          >
            返回
          </Button>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '8px', marginBottom: '12px' }}>
            {workName}
          </div>
          {checkedKeys.length > 0 && (
            <Button
              icon={<ExportOutlined />}
              onClick={handleExportToMarkdown}
              block
              type="primary"
            >
              导出选中内容 ({checkedKeys.length})
            </Button>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <Spin tip="加载中..." />
          </div>
        ) : (
          <div style={{ padding: '16px' }}>
            <Tree
              showIcon
              icon={renderTreeIcon}
              checkable
              checkedKeys={checkedKeys}
              onCheck={handleCheck}
              defaultExpandAll
              treeData={treeData}
              onSelect={handleSelect}
              titleRender={titleRender}
              blockNode
            />
          </div>
        )}
      </Sider>

      <Content
        style={{
          padding: '24px',
          background: '#f0f2f5'
        }}
      >
        {selectedNode ? (
          <Spin spinning={contentLoading}>
            <div
              style={{
                background: '#fff',
                padding: '24px',
                borderRadius: '8px',
                minHeight: 'calc(100vh - 48px)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0 }}>
                  {typeof selectedNode.title === 'string'
                    ? selectedNode.title
                    : selectedNode.title?.props?.children?.[0] || ''}
                </h2>
                <Button 
                  icon={<HistoryOutlined />}
                  onClick={handleShowVersions}
                >
                  版本历史
                </Button>
              </div>
              <TextArea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  setContentChanged(e.target.value !== originalContent)
                }}
                placeholder="在这里输入内容..."
                autoSize={{ minRows: 15, maxRows: 30 }}
                style={{ fontSize: '14px', marginBottom: '16px' }}
              />
              
              <Card 
                title={
                  <Space>
                    <RobotOutlined />
                    <span>AI 写作助手</span>
                    {estimatedTokens > 0 && (
                      <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>
                        (~{estimatedTokens} tokens)
                      </span>
                    )}
                  </Space>
                }
                size="small"
                style={{ marginBottom: '16px' }}
              >
                {checkedKeys.length > 0 && (
                  <div style={{ 
                    marginBottom: '12px', 
                    padding: '8px', 
                    background: '#f0f2f5', 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    已选择 {checkedKeys.length} 个节点作为参考上下文
                  </div>
                )}
                <Space.Compact style={{ width: '100%' }}>
                  <TextArea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="输入提示词，AI会根据当前内容和左侧勾选的节点生成文本..."
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    disabled={aiGenerating}
                    onPressEnter={(e) => {
                      if (e.shiftKey) return // Shift+Enter换行
                      e.preventDefault()
                      handleAiGenerate()
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    loading={aiGenerating}
                    onClick={handleAiGenerate}
                    style={{ alignSelf: 'flex-end' }}
                  >
                    发送
                  </Button>
                </Space.Compact>
              </Card>

              <div style={{ textAlign: 'right' }}>
                <Button 
                  type="primary" 
                  loading={saving} 
                  onClick={handleSaveContent}
                  disabled={!contentChanged}
                >
                  保存{contentChanged && ' *'}
                </Button>
              </div>
            </div>
          </Spin>
        ) : (
          <div
            style={{
              background: '#fff',
              padding: '48px',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#999'
            }}
          >
            <FileOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <p>请从左侧选择要编辑的内容</p>
          </div>
        )}
      </Content>

      {/* 版本历史Modal */}
      <Modal
        title="版本历史"
        open={versionModalVisible}
        onCancel={() => setVersionModalVisible(false)}
        footer={null}
        width={700}
      >
        <Spin spinning={loadingVersions}>
          {versions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              暂无历史版本
            </div>
          ) : (
            <List
              dataSource={versions}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      key="preview"
                      type="link"
                      onClick={() => handlePreviewVersion(item.version)}
                    >
                      预览
                    </Button>,
                    <Button
                      key="restore"
                      type="link"
                      onClick={() => handleRestoreVersion(item.version)}
                    >
                      恢复
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={`版本 ${item.version}`}
                    description={
                      <div>
                        <div>
                          <Text type="secondary">
                            创建时间: {new Date(item.created_at).toLocaleString('zh-CN')}
                          </Text>
                        </div>
                        {item.preview && (
                          <div style={{ marginTop: '8px' }}>
                            <Text type="secondary" ellipsis>
                              预览: {item.preview}...
                            </Text>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Modal>
    </Layout>
  )
}

WorkEditor.propTypes = {
  workId: PropTypes.number.isRequired,
  workName: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired
}

export default WorkEditor
