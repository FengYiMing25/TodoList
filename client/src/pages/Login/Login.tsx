import { useNavigate, Link } from 'react-router-dom'
import {
  Card,
  Form,
  Input,
  Button,
} from 'antd'
import {
  UserOutlined,
  LockOutlined,
  EyeTwoTone,
  EyeInvisibleOutlined,
  LoginOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@stores/authStore'
import { useMessage } from '@hooks/useMessage'
import styles from './Login.module.less'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const [form] = Form.useForm()
  const message = useMessage()

  const handleSubmit = async (values: { username: string; password: string }) => {
    try {
      await login(values.username.trim(), values.password)
      message.success('登录成功')
      navigate('/')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '登录失败')
    }
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>待办事项系统</h1>
          <p className={styles.subtitle}>登录您的账户</p>
        </div>

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              autoComplete="username"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
              autoComplete="current-password"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
              icon={<LoginOutlined />}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className={styles.footer}>
          <span>还没有账户？</span>
          <Link to="/register" className={styles.link}>
            立即注册
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default Login
