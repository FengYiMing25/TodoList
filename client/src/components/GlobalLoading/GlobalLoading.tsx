import { Spin } from 'antd'
import styles from './GlobalLoading.module.less'

const GlobalLoading: React.FC = () => {
  return (
    <div className={styles.container}>
      <Spin size="large" tip="加载中..." />
    </div>
  )
}

export default GlobalLoading
