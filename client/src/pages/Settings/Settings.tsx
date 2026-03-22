import { useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  Divider,
  Switch,
  Select,
  Avatar,
  Upload,
  Space,
} from 'antd'
import {
  SaveOutlined,
  CameraOutlined,
  UserOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { useAuthStore } from '@stores/authStore'
import { useSettingsStore } from '@stores/settingsStore'
import { useMessage } from '@hooks/useMessage'
import { useImageUpload } from '@hooks'
import styles from './Settings.module.less'

const themeColors = [
  { name: '默认蓝', value: '#1890ff' },
  { name: '极客紫', value: '#722ed1' },
  { name: '自然绿', value: '#52c41a' },
  { name: '活力橙', value: '#fa8c16' },
  { name: '热情红', value: '#ff4d4f' },
  { name: '科技青', value: '#13c2c2' },
]

const Settings: React.FC = () => {
  const { user, updateProfile } = useAuthStore()
  const {
    themeMode,
    primaryColor,
    fontSize,
    showCompleted,
    defaultPriority,
    setThemeMode,
    setPrimaryColor,
    setFontSize,
    setShowCompleted,
    setDefaultPriority,
    resetSettings,
  } = useSettingsStore()

  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const message = useMessage()

  const {
    imageUrl: avatarUrl,
    localPreview,
    uploading,
    selectFile,
    setImageUrl,
    uploadPendingFile,
    reset: resetImageUpload,
  } = useImageUpload({
    onSuccess: (url) => {
      updateProfile({ avatar: url })
      message.success('头像更新成功')
    },
    onError: () => {
      message.error('头像上传失败')
    },
  })

  useEffect(() => {
    if (user?.avatar) {
      setImageUrl(user.avatar)
    }
  }, [user?.avatar, setImageUrl])

  const handleProfileSubmit = async (values: { username: string; email: string }) => {
    try {
      await updateProfile(values)
      message.success('个人资料更新成功')
    } catch (error) {
      message.error('更新失败')
    }
  }

  const handlePasswordSubmit = async (values: {
    oldPassword: string
    newPassword: string
    confirmPassword: string
  }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次密码输入不一致')
      return
    }
    try {
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error) {
      message.error('密码修改失败')
    }
  }

  const handleResetSettings = () => {
    resetSettings()
    message.success('设置已重置')
  }

  const handleAvatarSelect = async (file: File) => {
    const success = selectFile(file)
    if (success) {
      await uploadPendingFile()
    }
  }

  const uploadProps: UploadProps = {
    showUploadList: false,
    beforeUpload: (file) => {
      handleAvatarSelect(file)
      return false
    },
  }

  const displayAvatar = localPreview || avatarUrl || user?.avatar

  return (
    <div className={styles.container}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="个人资料" className={styles.card}>
            <div className={styles.avatarSection}>
              <Upload {...uploadProps}>
                <Space direction="vertical" align="center">
                  <Avatar
                    size={80}
                    src={displayAvatar}
                    style={{ backgroundColor: primaryColor, cursor: 'pointer' }}
                    icon={uploading ? <LoadingOutlined /> : (!displayAvatar && <UserOutlined />)}
                  />
                  <Button icon={<CameraOutlined />} size="small" loading={uploading}>
                    {uploading ? '上传中...' : '更换头像'}
                  </Button>
                </Space>
              </Upload>
            </div>
            <Form
              form={profileForm}
              layout="vertical"
              initialValues={{
                username: user?.username || '',
                email: user?.email || '',
              }}
              onFinish={handleProfileSubmit}
            >
              <Form.Item name="username" label="用户名">
                <Input placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item name="email" label="邮箱">
                <Input type="email" placeholder="请输入邮箱" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  保存资料
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="修改密码" className={styles.card}>
            <Form form={passwordForm} layout="vertical" onFinish={handlePasswordSubmit}>
              <Form.Item
                name="oldPassword"
                label="当前密码"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password placeholder="请输入当前密码" />
              </Form.Item>
              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码至少6个字符' },
                ]}
              >
                <Input.Password placeholder="请输入新密码" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'))
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="请确认新密码" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="外观设置" className={styles.card}>
            <Row gutter={[24, 16]}>
              <Col xs={24} sm={12} lg={8}>
                <div className={styles.settingItem}>
                  <span className={styles.label}>主题模式</span>
                  <Select
                    value={themeMode}
                    onChange={setThemeMode}
                    style={{ width: 150 }}
                    options={[
                      { label: '浅色模式', value: 'light' },
                      { label: '深色模式', value: 'dark' },
                      { label: '跟随系统', value: 'system' },
                    ]}
                  />
                </div>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <div className={styles.settingItem}>
                  <span className={styles.label}>主题颜色</span>
                  <Select
                    value={primaryColor}
                    onChange={setPrimaryColor}
                    style={{ width: 150 }}
                    options={themeColors.map((c) => ({
                      label: (
                        <Space>
                          <div
                            className={styles.colorDot}
                            style={{ backgroundColor: c.value }}
                          />
                          {c.name}
                        </Space>
                      ),
                      value: c.value,
                    }))}
                  />
                </div>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <div className={styles.settingItem}>
                  <span className={styles.label}>字体大小</span>
                  <Select
                    value={fontSize}
                    onChange={setFontSize}
                    style={{ width: 150 }}
                    options={[
                      { label: '小 (12px)', value: 12 },
                      { label: '中 (14px)', value: 14 },
                      { label: '大 (16px)', value: 16 },
                      { label: '超大 (18px)', value: 18 },
                    ]}
                  />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="待办事项设置" className={styles.card}>
            <Row gutter={[24, 16]}>
              <Col xs={24} sm={12}>
                <div className={styles.settingItem}>
                  <span className={styles.label}>显示已完成的待办事项</span>
                  <Switch checked={showCompleted} onChange={setShowCompleted} />
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className={styles.settingItem}>
                  <span className={styles.label}>默认优先级</span>
                  <Select
                    value={defaultPriority}
                    onChange={setDefaultPriority}
                    style={{ width: 150 }}
                    options={[
                      { label: '低', value: 'low' },
                      { label: '中', value: 'medium' },
                      { label: '高', value: 'high' },
                    ]}
                  />
                </div>
              </Col>
            </Row>
            <Divider />
            <Button danger onClick={handleResetSettings}>
              重置所有设置
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Settings
