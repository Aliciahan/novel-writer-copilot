import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Card, Input, Button, Space, Select, message } from 'antd'
import { SendOutlined, RobotOutlined, ThunderboltOutlined } from '@ant-design/icons'

const { TextArea } = Input

function AIAssistant({ 
  prompt, 
  onPromptChange, 
  onGenerate, 
  generating, 
  checkedNodesCount, 
  estimatedTokens 
}) {
  const [promptTemplates, setPromptTemplates] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // 加载 Prompt 模板
  useEffect(() => {
    loadPromptTemplates()
  }, [])

  const loadPromptTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const templates = await window.api.getAllPrompts()
      setPromptTemplates(templates)
    } catch (error) {
      console.error('Failed to load prompt templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  // 选择模板
  const handleSelectTemplate = (templateId) => {
    const template = promptTemplates.find(t => t.id === templateId)
    if (template) {
      onPromptChange(template.content)
      message.success(`已加载模板: ${template.name}`)
    }
  }
  return (
    <Card 
      title={
        <Space size="small">
          <RobotOutlined style={{ fontSize: '14px' }} />
          <span style={{ fontSize: '13px' }}>AI 助手</span>
          {estimatedTokens > 0 && (
            <span style={{ fontSize: '11px', color: '#999' }}>
              (~{estimatedTokens}t)
            </span>
          )}
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={generating}
          onClick={onGenerate}
          size="small"
          disabled={!prompt.trim()}
        >
          发送
        </Button>
      }
      size="small"
      style={{ marginBottom: '12px' }}
      bodyStyle={{ padding: '8px' }}
    >
      {(promptTemplates.length > 0 || checkedNodesCount > 0) && (
        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {promptTemplates.length > 0 && (
            <Space size="small">
              <ThunderboltOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
              <Select
                size="small"
                style={{ width: 140 }}
                placeholder="选择模板"
                onChange={handleSelectTemplate}
                loading={loadingTemplates}
                options={promptTemplates.map(t => ({
                  label: t.name,
                  value: t.id
                }))}
                allowClear
              />
            </Space>
          )}
          {checkedNodesCount > 0 && (
            <div style={{ 
              padding: '2px 8px', 
              background: '#f0f2f5', 
              borderRadius: '2px',
              fontSize: '11px',
              color: '#666'
            }}>
              已选 {checkedNodesCount} 个节点
            </div>
          )}
        </div>
      )}
      <TextArea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder="输入提示词，AI会根据当前内容和左侧勾选的节点生成文本..."
        autoSize={{ minRows: 2, maxRows: 4 }}
        disabled={generating}
        onPressEnter={(e) => {
          if (e.shiftKey) return // Shift+Enter换行
          if (prompt.trim()) {
            e.preventDefault()
            onGenerate()
          }
        }}
      />
    </Card>
  )
}

AIAssistant.propTypes = {
  prompt: PropTypes.string.isRequired,
  onPromptChange: PropTypes.func.isRequired,
  onGenerate: PropTypes.func.isRequired,
  generating: PropTypes.bool.isRequired,
  checkedNodesCount: PropTypes.number.isRequired,
  estimatedTokens: PropTypes.number.isRequired
}

export default AIAssistant
