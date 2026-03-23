import { Typography, Space } from 'antd'
import styles from './PageTitle.module.less'

const { Title } = Typography

interface PageTitleProps {
  title: string
  emoji?: string
  icon?: React.ReactNode
  level?: 1 | 2 | 3 | 4 | 5
  className?: string
}

const PageTitle: React.FC<PageTitleProps> = ({
  title,
  emoji,
  icon,
  level = 4,
  className,
}) => {
  return (
    <div className={`${styles.pageTitle} ${className || ''}`}>
      <Title level={level} className={styles.title}>
        <Space size={8}>
          {emoji && <span className={styles.emoji}>{emoji}</span>}
          {icon}
          <span>{title}</span>
        </Space>
      </Title>
    </div>
  )
}

export default PageTitle
