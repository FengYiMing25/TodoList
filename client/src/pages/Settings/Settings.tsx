import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Avatar,
  IconButton,
} from '@mui/material'
import { PhotoCamera as CameraIcon, Save as SaveIcon } from '@mui/icons-material'
import { useAuthStore } from '@stores/authStore'
import { useSettingsStore } from '@stores/settingsStore'
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

  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
  })
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })

  const handleProfileSubmit = async () => {
    try {
      await updateProfile(profileForm)
      setSnackbar({ open: true, message: '个人资料更新成功', severity: 'success' })
    } catch (error) {
      setSnackbar({ open: true, message: '更新失败', severity: 'error' })
    }
  }

  const handlePasswordSubmit = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSnackbar({ open: true, message: '两次密码输入不一致', severity: 'error' })
      return
    }
    try {
      setSnackbar({ open: true, message: '密码修改成功', severity: 'success' })
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      setSnackbar({ open: true, message: '密码修改失败', severity: 'error' })
    }
  }

  const handleResetSettings = () => {
    resetSettings()
    setSnackbar({ open: true, message: '设置已重置', severity: 'success' })
  }

  return (
    <Box className={styles.container}>
      <Typography variant="h4" className={styles.pageTitle}>
        系统设置
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card className={styles.card}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                个人资料
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box className={styles.avatarSection}>
                <Avatar
                  src={user?.avatar}
                  sx={{ width: 80, height: 80, bgcolor: primaryColor }}
                >
                  {user?.username?.charAt(0).toUpperCase()}
                </Avatar>
                <IconButton component="label" className={styles.avatarUpload}>
                  <CameraIcon />
                  <input type="file" hidden accept="image/*" />
                </IconButton>
              </Box>
              <TextField
                fullWidth
                label="用户名"
                value={profileForm.username}
                onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="邮箱"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                margin="normal"
              />
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleProfileSubmit}
                sx={{ mt: 2 }}
              >
                保存资料
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className={styles.card}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                修改密码
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TextField
                fullWidth
                label="当前密码"
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="新密码"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="确认新密码"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                margin="normal"
              />
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handlePasswordSubmit}
                sx={{ mt: 2 }}
              >
                修改密码
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card className={styles.card}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                外观设置
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>主题模式</InputLabel>
                    <Select
                      value={themeMode}
                      label="主题模式"
                      onChange={(e) => setThemeMode(e.target.value as 'light' | 'dark' | 'system')}
                    >
                      <MenuItem value="light">浅色模式</MenuItem>
                      <MenuItem value="dark">深色模式</MenuItem>
                      <MenuItem value="system">跟随系统</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>主题颜色</InputLabel>
                    <Select
                      value={primaryColor}
                      label="主题颜色"
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    >
                      {themeColors.map((color) => (
                        <MenuItem key={color.value} value={color.value}>
                          <Box className={styles.colorOption}>
                            <Box
                              className={styles.colorDot}
                              style={{ backgroundColor: color.value }}
                            />
                            {color.name}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>字体大小</InputLabel>
                    <Select
                      value={fontSize}
                      label="字体大小"
                      onChange={(e) => setFontSize(e.target.value as number)}
                    >
                      <MenuItem value={12}>小 (12px)</MenuItem>
                      <MenuItem value={14}>中 (14px)</MenuItem>
                      <MenuItem value={16}>大 (16px)</MenuItem>
                      <MenuItem value={18}>超大 (18px)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card className={styles.card}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                待办事项设置
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showCompleted}
                        onChange={(e) => setShowCompleted(e.target.checked)}
                      />
                    }
                    label="显示已完成的待办事项"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>默认优先级</InputLabel>
                    <Select
                      value={defaultPriority}
                      label="默认优先级"
                      onChange={(e) => setDefaultPriority(e.target.value as 'low' | 'medium' | 'high')}
                    >
                      <MenuItem value="low">低</MenuItem>
                      <MenuItem value="medium">中</MenuItem>
                      <MenuItem value="high">高</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Box sx={{ mt: 3 }}>
                <Button variant="outlined" color="error" onClick={handleResetSettings}>
                  重置所有设置
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Settings
