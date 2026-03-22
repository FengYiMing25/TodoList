import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import { HomeOutlined } from '@ant-design/icons'
import styles from './NotFound.module.less'

const NotFound: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className={styles.container}>
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在"
        extra={
          <Button
            type="primary"
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
          >
            返回首页
          </Button>
        }
      />
    </div>
  )
}

export default NotFound
