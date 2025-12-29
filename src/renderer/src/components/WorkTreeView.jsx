import PropTypes from 'prop-types'
import { Tree, Button, Spin, Space, Dropdown } from 'antd'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { 
  ArrowLeftOutlined, 
  FolderOutlined, 
  FileOutlined, 
  CopyOutlined, 
  ExportOutlined,
  EllipsisOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons'

const WorkTreeView = forwardRef(function WorkTreeView({ 
  workName,
  treeData,
  loading,
  checkedKeys,
  onCheck,
  onSelect,
  onBack,
  onCopy,
  onExport,
  onExportAllContent,
  onAddVolume,
  onAddChapter,
  onDeleteNode,
  expandedKeys,
  onExpand
}, ref) {
  const scrollContainerRef = useRef(null)

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    getScrollPosition: () => {
      const position = scrollContainerRef.current?.scrollTop || 0
      console.log('Getting scroll position:', position)
      return position
    },
    setScrollPosition: (position) => {
      console.log('Setting scroll position to:', position)
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = position
        console.log('Scroll position set to:', scrollContainerRef.current.scrollTop)
      }
    }
  }))

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

    // 卷节点可以删除（检查是否是卷节点）
    if (nodeData.title && nodeData.title.startsWith('卷')) {
      items.push({
        key: 'delete-volume',
        label: '删除此卷',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => onDeleteNode(nodeData.id, nodeData.title, 'volume')
      })
    }

    // 章节节点可以删除（检查是否是章节节点）
    if (nodeData.title && nodeData.title.startsWith('正文章节')) {
      items.push({
        key: 'delete-chapter',
        label: '删除此章节',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => onDeleteNode(nodeData.id, nodeData.title, 'chapter')
      })
    }

    return items
  }

  // 使用titleRender自定义节点标题
  const titleRender = (nodeData) => {
    const menuItems = getNodeMenuItems(nodeData)
    
    // 如果是"正文"节点且有内容预览，显示预览
    let displayTitle = nodeData.title
    if (nodeData.title === '正文' && nodeData.contentPreview) {
      displayTitle = `正文(${nodeData.contentPreview}...)`
    }

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
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {displayTitle}
          {nodeData.hasContent && (
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#52c41a',
                flexShrink: 0
              }}
              title="已有内容"
            />
          )}
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
        {checkedKeys.length > 0 ? (
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
            <Button
              icon={<ExportOutlined />}
              onClick={onExportAllContent}
              size="small"
              style={{ flex: 1, fontSize: '12px' }}
            >
              导出正文
            </Button>
          </Space>
        ) : (
          <Button
            icon={<ExportOutlined />}
            onClick={onExportAllContent}
            size="small"
            style={{ width: '100%', fontSize: '12px' }}
          >
            导出正文
          </Button>
        )}
      </div>

      <div ref={scrollContainerRef} style={{ padding: '8px 12px', flex: 1, overflow: 'auto' }}>
        {loading && (
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <Spin size="small" tip="加载中..." />
          </div>
        )}
        {!loading && (
          <Tree
            showIcon
            icon={renderTreeIcon}
            checkable
            checkedKeys={checkedKeys}
            onCheck={onCheck}
            expandedKeys={expandedKeys}
            onExpand={onExpand}
            autoExpandParent={false}
            treeData={treeData}
            onSelect={onSelect}
            titleRender={titleRender}
            blockNode
          />
        )}
      </div>
    </div>
  )
})

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
  onExportAllContent: PropTypes.func.isRequired,
  onAddVolume: PropTypes.func.isRequired,
  onAddChapter: PropTypes.func.isRequired,
  onDeleteNode: PropTypes.func.isRequired,
  expandedKeys: PropTypes.array.isRequired,
  onExpand: PropTypes.func.isRequired
}

export default WorkTreeView
