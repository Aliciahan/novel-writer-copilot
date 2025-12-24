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
  estimatedTokens,
  wordCount
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
          padding: '16px',
          borderRadius: '4px',
          height: 'calc(100vh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flex: '0 0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
              {typeof selectedNode.title === 'string'
                ? selectedNode.title
                : selectedNode.title?.props?.children?.[0] || ''}
            </h3>
            <span style={{ fontSize: '13px', color: '#999' }}>
              {wordCount} 字
            </span>
          </div>
          <Button 
            size="small"
            icon={<HistoryOutlined />}
            onClick={onShowVersions}
          >
            历史
          </Button>
        </div>

        <div style={{ flex: '1 1 auto', marginBottom: '12px', overflow: 'auto' }}>
          <TextArea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="在这里输入内容..."
            style={{ fontSize: '14px', height: '100%', resize: 'none' }}
          />
        </div>

        <div style={{ flex: '0 0 auto' }}>
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
              size="small"
              type="primary" 
              loading={saving} 
              onClick={onSave}
              disabled={!contentChanged}
            >
              保存{contentChanged && ' *'}
            </Button>
          </div>
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
  estimatedTokens: PropTypes.number.isRequired,
  wordCount: PropTypes.number.isRequired
}

export default ContentEditor
