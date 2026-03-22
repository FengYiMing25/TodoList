import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import styles from './PageProgress.module.less'

const PageProgress: React.FC = () => {
  const location = useLocation()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    setProgress(30)

    const timer1 = setTimeout(() => setProgress(60), 100)
    const timer2 = setTimeout(() => setProgress(90), 200)
    const timer3 = setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 200)
    }, 300)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [location.pathname])

  if (!visible) return null

  return (
    <div className={styles.progress} style={{ opacity: progress === 100 ? 0 : 1 }}>
      <div 
        className={styles.progressBar} 
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export default PageProgress
