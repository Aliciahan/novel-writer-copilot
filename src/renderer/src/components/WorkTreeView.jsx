import PropTypes from 'prop-types'
import { Tree, Button, Spin, Space, Dropdown } from 'antd'
import { 
  ArrowLeftOutlined, 
  FolderOutlined, 
  FileOutlined, 
  CopyOutlined, 
  ExportOutlined,
  EllipsisOutlined,
  PlusOutlined
} from '@ant-design/icons'

function WorkTreeView({ 
  workName,
  treeData,
  loading,
  checkedKeys,
  onCheck,
  onSelect,
  onBack,
  onCopy,
  onExport,
  onAddVolume,
  onAddChapter
}) {
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
        onClick: () => onAddVolume(nodeData.id)
      })
    }

    // 本卷正文节点可以添加章节
    if (nodeData.title === '本卷正文') {
      items.push({
        key: 'add-chapter',
        label: '添加新章节',
        icon: <PlusOutlined />,
        onClick: () => onAddChapter(nodeData.id)
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
        <Button
          size="small"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          style={{ marginBottom: '8px' }}
        >
          返回
        </Button>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
          {workName}
        </div>
        {checkedKeys.length > 0 && (
          <Space style={{ width: '100%' }} size={4}>
            <Button
              icon={<CopyOutlined />}
              onClick={onCopy}
              size="small"
              style={{ flex: 1, fontSize: '12px' }}
            >
              复制({checkedKeys.length})
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={onExport}
              size="small"
              type="primary"
              style={{ flex: 1, fontSize: '12px' }}
            >
              导出({checkedKeys.length})
            </Button>
          </Space>
        )}
      </div>

      <div style={{ padding: '8px 12px', flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <Spin size="small" tip="加载中..." />
          </div>
        ) : (
          <Tree
            showIcon
            icon={renderTreeIcon}
            checkable
            checkedKeys={checkedKeys}
            onCheck={onCheck}
            defaultExpandAll
            treeData={treeData}
            onSelect={onSelect}
            titleRender={titleRender}
            blockNode
          />
        )}
      </div>
    </div>
  )
}

WorkTreeView.propTypes = {
  workName: PropTypes.string.isRequired,
  treeData: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  checkedKeys: PropTypes.array.isRequired,
  onCheck: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onCopy: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  onAddVolume: PropTypes.func.isRequired,
  onAddChapter: PropTypes.func.isRequired
}

export default WorkTreeView
