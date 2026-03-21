import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Home as HomeIcon } from '@mui/icons-material'
import styles from './NotFound.module.less'

const NotFound: React.FC = () => {
  const navigate = useNavigate()

  return (
    <Box className={styles.container}>
      <Typography variant="h1" className={styles.code}>
        404
      </Typography>
      <Typography variant="h5" className={styles.message}>
        页面不存在
      </Typography>
      <Typography variant="body1" color="text.secondary" className={styles.description}>
        您访问的页面不存在或已被移除
      </Typography>
      <Button
        variant="contained"
        startIcon={<HomeIcon />}
        onClick={() => navigate('/')}
        className={styles.button}
      >
        返回首页
      </Button>
    </Box>
  )
}

export default NotFound
