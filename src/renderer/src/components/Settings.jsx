import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Card, Button, Input, Space, Typography, message, Form, Select } from 'antd'
import { FolderOpenOutlined, ArrowLeftOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

function Settings({ onBack }) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // 加载设置
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const allSettings = await window.api.getAllSettings()
      form.setFieldsValue({
        outputFolder: allSettings.outputFolder || '',
        googleApiKey: allSettings.googleApiKey || '',
        modelName: allSettings.modelName || 'gemini-pro'
      })
    } catch (error) {
      console.error('Failed to load settings:', error)
      message.error('加载设置失败')
    }
  }

  const handleSelectFolder = async () => {
    try {
      const folder = await window.api.selectFolder()
      if (folder) {
        form.setFieldsValue({ outputFolder: folder })
      }
    } catch (error) {
      console.error('Failed to select folder:', error)
      message.error('选择文件夹失败')
    }
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      
      setLoading(true)

      // 保存所有设置
      const savePromises = [
        window.api.setSetting('outputFolder', values.outputFolder || ''),
        window.api.setSetting('googleApiKey', values.googleApiKey || ''),
        window.api.setSetting('modelName', values.modelName || 'gemini-pro')
      ]

      const results = await Promise.all(savePromises)
      
      if (results.every((r) => r)) {
        message.success('设置保存成功')
      } else {
        message.error('部分设置保存失败')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      if (error.errorFields) {
        message.error('请填写必填项')
      } else {
        message.error('设置保存失败')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        {onBack && (
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            style={{ marginBottom: '16px' }}
          >
            返回
          </Button>
        )}
        <Title level={2}>Settings</Title>
      </div>
      
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            label="Google API Key"
            name="googleApiKey"
            rules={[{ required: true, message: '请输入Google API Key' }]}
          >
            <Input.Password 
              placeholder="输入你的Google AI Studio API Key"
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            label="AI Model"
            name="modelName"
            rules={[{ required: true, message: '请选择AI模型' }]}
          >
            <Select placeholder="选择AI模型">
              <Select.Option value="gemini-2.5-flash">gemini-2.5-flash</Select.Option>
              <Select.Option value="gemini-3-pro-preview">gemini-3-pro-preview</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Output Folder"
            name="outputFolder"
          >
            <Input
              placeholder="选择输出文件夹"
              readOnly
              addonAfter={
                <Button
                  type="link"
                  icon={<FolderOpenOutlined />}
                  onClick={handleSelectFolder}
                  style={{ padding: 0, height: 'auto' }}
                >
                  选择
                </Button>
              }
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

Settings.propTypes = {
  onBack: PropTypes.func
}

export default Settings
