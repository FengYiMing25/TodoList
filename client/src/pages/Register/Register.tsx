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
  MailOutlined,
  EyeTwoTone,
  EyeInvisibleOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@stores/authStore'
import { useMessage } from '@hooks/useMessage'
import styles from './Register.module.less'

const Register: React.FC = () => {
  const navigate = useNavigate()
  const { register, isLoading } = useAuthStore()
  const [form] = Form.useForm()
  const message = useMessage()

  const handleSubmit = async (values: {
    username: string
    email: string
    password: string
    confirmPassword: string
  }) => {
    try {
      await register(
        values.username.trim(),
        values.email.trim(),
        values.password
      )
      message.success('注册成功')
      navigate('/')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '注册失败')
    }
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>创建账户</h1>
          <p className={styles.subtitle}>注册一个新的账户</p>
        </div>

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
            />
          </Form.Item>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="邮箱"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认密码"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
              icon={<UserAddOutlined />}
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <div className={styles.footer}>
          <span>已有账户？</span>
          <Link to="/login" className={styles.link}>
            立即登录
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default Register
