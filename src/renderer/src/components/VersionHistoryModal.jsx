import PropTypes from 'prop-types'
import { Modal, List, Button, Spin, Typography } from 'antd'

const { Text } = Typography

function VersionHistoryModal({ 
  visible, 
  onClose, 
  versions, 
  loading, 
  onPreview, 
  onRestore 
}) {
  return (
    <Modal
      title="版本历史"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Spin spinning={loading}>
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
                    onClick={() => onPreview(item.version)}
                  >
                    预览
                  </Button>,
                  <Button
                    key="restore"
                    type="link"
                    onClick={() => onRestore(item.version)}
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
  )
}

VersionHistoryModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  versions: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  onPreview: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired
}

export default VersionHistoryModal
