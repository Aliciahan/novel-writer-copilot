import { useState, useEffect } from 'react'
import { Card, Button, List, Modal, Form, Input, message, Space, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons'

const { TextArea } = Input

function PromptConfiguration({ onBack }) {
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState(null)
  const [form] = Form.useForm()

  // 加载所有 Prompt 模板
  const loadPrompts = async () => {
    setLoading(true)
    try {
      const allPrompts = await window.api.getAllPrompts()
      setPrompts(allPrompts)
    } catch (error) {
      console.error('Failed to load prompts:', error)
      message.error('加载 Prompt 模板失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrompts()
  }, [])

  // 打开创建/编辑对话框
  const handleOpenModal = (prompt = null) => {
    setEditingPrompt(prompt)
    if (prompt) {
      form.setFieldsValue({
        name: prompt.name,
        content: prompt.content
      })
    } else {
      form.resetFields()
    }
    setModalVisible(true)
  }

  // 关闭对话框
  const handleCloseModal = () => {
    setModalVisible(false)
    setEditingPrompt(null)
    form.resetFields()
  }

  // 保存 Prompt
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingPrompt) {
        // 更新
        await window.api.updatePrompt(editingPrompt.id, values.name, values.content)
        message.success('Prompt 模板更新成功')
      } else {
        // 创建
        await window.api.createPrompt(values.name, values.content)
        message.success('Prompt 模板创建成功')
      }
      
      handleCloseModal()
      loadPrompts()
    } catch (error) {
      console.error('Failed to save prompt:', error)
      message.error('保存失败')
    }
  }

  // 删除 Prompt
  const handleDelete = async (id) => {
    try {
      await window.api.deletePrompt(id)
      message.success('Prompt 模板删除成功')
      loadPrompts()
    } catch (error) {
      console.error('Failed to delete prompt:', error)
      message.error('删除失败')
    }
  }

  return (
    <div style={{ padding: '12px' }}>
      <Card
        size="small"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button size="small" icon={<ArrowLeftOutlined />} onClick={onBack}>
              返回
            </Button>
            <span style={{ fontSize: '14px' }}>Prompt 模板</span>
          </div>
        }
        extra={
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            新建
          </Button>
        }
      >
        <List
          loading={loading}
          dataSource={prompts}
          locale={{ emptyText: '暂无 Prompt 模板，点击"新建模板"创建' }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="edit"
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleOpenModal(item)}
                >
                  编辑
                </Button>,
                <Popconfirm
                  key="delete"
                  title="确定要删除这个模板吗？"
                  onConfirm={() => handleDelete(item.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="link" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                title={<strong>{item.name}</strong>}
                description={
                  <div style={{ color: '#666', whiteSpace: 'pre-wrap', maxHeight: '100px', overflow: 'hidden' }}>
                    {item.content.substring(0, 150)}
                    {item.content.length > 150 && '...'}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title={editingPrompt ? '编辑 Prompt 模板' : '新建 Prompt 模板'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={handleCloseModal}
        width={700}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="例如：续写故事、生成大纲、润色文字" />
          </Form.Item>
          <Form.Item
            name="content"
            label="Prompt 内容"
            rules={[{ required: true, message: '请输入 Prompt 内容' }]}
          >
            <TextArea
              rows={10}
              placeholder="请输入 Prompt 模板内容..."
              style={{ fontSize: '14px' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PromptConfiguration
