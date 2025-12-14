import PropTypes from 'prop-types'
import { Card, Input, Button, Space } from 'antd'
import { SendOutlined, RobotOutlined } from '@ant-design/icons'

const { TextArea } = Input

function AIAssistant({ 
  prompt, 
  onPromptChange, 
  onGenerate, 
  generating, 
  checkedNodesCount, 
  estimatedTokens 
}) {
  return (
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
      {checkedNodesCount > 0 && (
        <div style={{ 
          marginBottom: '12px', 
          padding: '8px', 
          background: '#f0f2f5', 
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          已选择 {checkedNodesCount} 个节点作为参考上下文
        </div>
      )}
      <Space.Compact style={{ width: '100%' }}>
        <TextArea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="输入提示词，AI会根据当前内容和左侧勾选的节点生成文本..."
          autoSize={{ minRows: 2, maxRows: 4 }}
          disabled={generating}
          onPressEnter={(e) => {
            if (e.shiftKey) return // Shift+Enter换行
            e.preventDefault()
            onGenerate()
          }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={generating}
          onClick={onGenerate}
          style={{ alignSelf: 'flex-end' }}
        >
          发送
        </Button>
      </Space.Compact>
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
