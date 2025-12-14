import PropTypes from 'prop-types'
import { Input, Button, Spin } from 'antd'
import { HistoryOutlined } from '@ant-design/icons'
import AIAssistant from './AIAssistant'

const { TextArea } = Input

function ContentEditor({ 
  selectedNode,
  content,
  onContentChange,
  contentLoading,
  saving,
  contentChanged,
  onSave,
  onShowVersions,
  // AI props
  aiPrompt,
  onAiPromptChange,
  onAiGenerate,
  aiGenerating,
  checkedNodesCount,
  estimatedTokens
}) {
  if (!selectedNode) {
    return (
      <div
        style={{
          background: '#fff',
          padding: '48px',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#999'
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
        <p>请从左侧选择要编辑的内容</p>
      </div>
    )
  }

  return (
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
            onClick={onShowVersions}
          >
            版本历史
          </Button>
        </div>

        <TextArea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="在这里输入内容..."
          autoSize={{ minRows: 15, maxRows: 30 }}
          style={{ fontSize: '14px', marginBottom: '16px' }}
        />

        <AIAssistant
          prompt={aiPrompt}
          onPromptChange={onAiPromptChange}
          onGenerate={onAiGenerate}
          generating={aiGenerating}
          checkedNodesCount={checkedNodesCount}
          estimatedTokens={estimatedTokens}
        />

        <div style={{ textAlign: 'right' }}>
          <Button 
            type="primary" 
            loading={saving} 
            onClick={onSave}
            disabled={!contentChanged}
          >
            保存{contentChanged && ' *'}
          </Button>
        </div>
      </div>
    </Spin>
  )
}

ContentEditor.propTypes = {
  selectedNode: PropTypes.object,
  content: PropTypes.string.isRequired,
  onContentChange: PropTypes.func.isRequired,
  contentLoading: PropTypes.bool.isRequired,
  saving: PropTypes.bool.isRequired,
  contentChanged: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
  onShowVersions: PropTypes.func.isRequired,
  aiPrompt: PropTypes.string.isRequired,
  onAiPromptChange: PropTypes.func.isRequired,
  onAiGenerate: PropTypes.func.isRequired,
  aiGenerating: PropTypes.bool.isRequired,
  checkedNodesCount: PropTypes.number.isRequired,
  estimatedTokens: PropTypes.number.isRequired
}

export default ContentEditor
