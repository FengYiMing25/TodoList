import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { ProLayout, PageContainer } from '@ant-design/pro-components'
import { Dropdown, Avatar, Space, Badge, theme } from 'antd'
import {
  DashboardOutlined,
  CheckSquareOutlined,
  WalletOutlined,
  AppstoreOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
  SkinOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@stores/authStore'
import { useSettingsStore } from '@stores/settingsStore'
import PageProgress from '@components/PageProgress'
import styles from './Layout.module.less'

const menuItems = [
  {
    path: '/',
    name: '仪表盘',
    icon: <DashboardOutlined />,
  },
  {
    path: '/todos',
    name: '待办事项',
    icon: <CheckSquareOutlined />,
  },
  {
    path: '/accounts',
    name: '记账本',
    icon: <WalletOutlined />,
  },
  {
    path: '/wardrobe',
    name: '电子衣橱',
    icon: <SkinOutlined />,
  },
  {
    path: '/categories',
    name: '分类管理',
    icon: <AppstoreOutlined />,
  },
  {
    path: '/settings',
    name: '系统设置',
    icon: <SettingOutlined />,
  },
]

const Layout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { themeMode } = useSettingsStore()
  const [collapsed, setCollapsed] = useState(false)
  const [systemDark, setSystemDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const { token } = theme.useToken()

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches)
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemDark)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  const siderBg = isDark ? '#141414' : '#1e293b'

  return (
    <>
      <PageProgress />
      <ProLayout
        title="待办事项管理系统"
        logo={null}
        layout="mix"
        collapsed={collapsed}
        onCollapse={setCollapsed}
        location={{ pathname: location.pathname }}
        route={{ routes: menuItems }}
        menuItemRender={(item, dom) => (
          <div onClick={() => navigate(item.path || '/')}>{dom}</div>
        )}
        actionsRender={() => [
          <Badge key="notification" count={0} size="small">
            <BellOutlined style={{ fontSize: 16, cursor: 'pointer' }} />
          </Badge>,
          <Dropdown key="user" menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                size="small"
                src={user?.avatar}
                style={{ backgroundColor: token.colorPrimary }}
                icon={!user?.avatar && <UserOutlined />}
              />
              <span style={{ fontSize: 14 }}>{user?.username || '用户'}</span>
            </Space>
          </Dropdown>,
        ]}

        menuFooterRender={(props) => {
          if (props?.collapsed) return undefined
          return (
            <div style={{ textAlign: 'center', paddingBlockStart: 12 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>v1.0.0</div>
            </div>
          )
        }}
        token={{
          header: {
            colorBgHeader: isDark ? '#1a1a1a' : '#ffffff',
            colorHeaderTitle: isDark ? '#ffffff' : '#1f2937',
            colorTextMenu: isDark ? 'rgba(255,255,255,0.65)' : '#374151',
            colorTextMenuActive: token.colorPrimary,
            colorTextMenuSelected: token.colorPrimary,
          },
          sider: {
            colorMenuBackground: siderBg,
            colorTextMenu: 'rgba(255,255,255,0.85)',
            colorTextMenuActive: '#ffffff',
            colorTextMenuSelected: '#ffffff',
            colorBgMenuItemSelected: token.colorPrimary,
            colorBgMenuItemHover: 'rgba(255, 255, 255, 0.08)',
          },
          pageContainer: {
            colorBgPageContainer: isDark ? '#0d0d0d' : '#f5f7fa',
          },
        }}
      >
        <PageContainer
          header={{
            title: null,
            breadcrumb: {},
          }}
          className={styles.pageContainer}
        >
          <Outlet />
        </PageContainer>
      </ProLayout>
    </>
  )
}

export default Layout
