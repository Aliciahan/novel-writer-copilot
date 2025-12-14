import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  Button,
  Typography,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Empty,
  Row,
  Col
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

function WorkLibrary({ onOpenWork, onOpenPrompts }) {
  const [works, setWorks] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingWork, setEditingWork] = useState(null)
  const [form] = Form.useForm()

  // 加载所有作品
  useEffect(() => {
    loadWorks()
  }, [])

  const loadWorks = async () => {
    setLoading(true)
    try {
      const allWorks = await window.api.getAllWorks()
      setWorks(allWorks)
    } catch (error) {
      console.error('Failed to load works:', error)
      message.error('加载作品列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 打开新建/编辑对话框
  const handleOpenModal = (work = null) => {
    setEditingWork(work)
    if (work) {
      form.setFieldsValue({
        name: work.name,
        description: work.description
      })
    } else {
      form.resetFields()
    }
    setModalVisible(true)
  }

  // 关闭对话框
  const handleCloseModal = () => {
    setModalVisible(false)
    setEditingWork(null)
    form.resetFields()
  }

  // 保存作品（新建或更新）
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      if (editingWork) {
        // 更新现有作品
        const success = await window.api.updateWork(
          editingWork.id,
          values.name,
          values.description || ''
        )
        if (success) {
          message.success('作品更新成功')
          await loadWorks()
          handleCloseModal()
        } else {
          message.error('作品更新失败')
        }
      } else {
        // 创建新作品
        const newWork = await window.api.createWork(values.name, values.description || '')
        if (newWork) {
          message.success('作品创建成功')
          await loadWorks()
          handleCloseModal()
        } else {
          message.error('作品创建失败')
        }
      }
    } catch (error) {
      console.error('Failed to save work:', error)
      if (error.errorFields) {
        // 表单验证失败
        return
      }
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除作品
  const handleDelete = async (id) => {
    setLoading(true)
    try {
      const success = await window.api.deleteWork(id)
      if (success) {
        message.success('作品删除成功')
        await loadWorks()
      } else {
        message.error('作品删除失败')
      }
    } catch (error) {
      console.error('Failed to delete work:', error)
      message.error('删除失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>
            <BookOutlined /> 作品书架
          </Title>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              size="large"
              icon={<ThunderboltOutlined />}
              onClick={onOpenPrompts}
            >
              Prompt 模板
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              新建作品
            </Button>
          </div>
        </div>

        {works.length === 0 ? (
          <Card>
            <Empty
              description="还没有任何作品，开始创作吧！"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
                创建第一个作品
              </Button>
            </Empty>
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {works.map((work) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={work.id}>
                <Card
                  hoverable
                  loading={loading}
                  onClick={() => onOpenWork(work)}
                  style={{ cursor: 'pointer' }}
                  actions={[
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenModal(work)
                      }}
                      key="edit"
                    >
                      编辑
                    </Button>,
                    <Popconfirm
                      title="确认删除"
                      description="确定要删除这个作品吗？"
                      onConfirm={(e) => {
                        e.stopPropagation()
                        handleDelete(work.id)
                      }}
                      okText="确定"
                      cancelText="取消"
                      key="delete"
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  ]}
                >
                  <Card.Meta
                    title={
                      <Text strong ellipsis={{ tooltip: work.name }}>
                        {work.name}
                      </Text>
                    }
                    description={
                      <Paragraph
                        ellipsis={{ rows: 3, tooltip: work.description }}
                        style={{ marginBottom: 0, minHeight: '66px' }}
                      >
                        {work.description || '暂无描述'}
                      </Paragraph>
                    }
                  />
                  <div style={{ marginTop: '12px', fontSize: '12px', color: '#999' }}>
                    更新于: {new Date(work.updated_at).toLocaleDateString()}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* 新建/编辑对话框 */}
        <Modal
          title={editingWork ? '编辑作品' : '新建作品'}
          open={modalVisible}
          onOk={handleSave}
          onCancel={handleCloseModal}
          confirmLoading={loading}
          okText="保存"
          cancelText="取消"
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            style={{ marginTop: '24px' }}
          >
            <Form.Item
              name="name"
              label="作品名称"
              rules={[
                { required: true, message: '请输入作品名称' },
                { max: 100, message: '作品名称不能超过100个字符' }
              ]}
            >
              <Input placeholder="请输入作品名称" />
            </Form.Item>

            <Form.Item
              name="description"
              label="作品描述"
              rules={[
                { max: 500, message: '描述不能超过500个字符' }
              ]}
            >
              <TextArea
                rows={4}
                placeholder="请输入作品描述（可选）"
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  )
}

WorkLibrary.propTypes = {
  onOpenWork: PropTypes.func.isRequired,
  onOpenPrompts: PropTypes.func.isRequired
}

export default WorkLibrary
