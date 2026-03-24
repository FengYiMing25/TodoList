import { useEffect, useMemo, useState } from 'react'
import { ConfigProvider, App as AntApp, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useSettingsStore } from '@stores/settingsStore'

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { themeMode, primaryColor, fontSize } = useSettingsStore()
  const [systemDark, setSystemDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches)
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemDark
    }
    return themeMode === 'dark'
  }, [themeMode, systemDark])

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
    } else {
      root.classList.remove('dark')
      root.setAttribute('data-theme', 'light')
    }
  }, [isDark])

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', primaryColor)
  }, [primaryColor])

  useEffect(() => {
    const root = document.documentElement
    const baseFontSize = fontSize
    root.style.setProperty('--font-size-base', `${baseFontSize}px`)
    root.style.setProperty('--font-size-sm', `${baseFontSize - 2}px`)
    root.style.setProperty('--font-size-lg', `${baseFontSize + 2}px`)
    root.style.setProperty('--font-size-xl', `${baseFontSize + 6}px`)
    root.style.fontSize = `${baseFontSize}px`
  }, [fontSize])

  const antdTheme = useMemo(() => ({
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: primaryColor,
      borderRadius: 8,
      fontSize: fontSize,
      fontSizeHeading1: fontSize + 14,
      fontSizeHeading2: fontSize + 8,
      fontSizeHeading3: fontSize + 4,
      lineHeight: 1.6,
      colorBgContainer: isDark ? '#1a1a1a' : '#ffffff',
      colorBgLayout: isDark ? '#0d0d0d' : '#f5f7fa',
      colorBorder: isDark ? '#303030' : '#e8e8e8',
      colorText: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.88)',
      colorTextSecondary: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)',
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: '#ff4d4f',
      colorInfo: primaryColor,
    },
    components: {
      Layout: {
        siderBg: isDark ? '#141414' : '#1e293b',
        headerBg: isDark ? '#1a1a1a' : '#ffffff',
        bodyBg: isDark ? '#0d0d0d' : '#f5f7fa',
        headerHeight: 56,
      },
      Menu: {
        darkItemBg: isDark ? '#141414' : '#1e293b',
        darkItemSelectedBg: primaryColor,
        itemBorderRadius: 6,
        itemMarginBlock: 4,
        itemMarginInline: 8,
      },
      Card: {
        colorBgContainer: isDark ? '#1a1a1a' : '#ffffff',
        borderRadiusLG: 12,
        boxShadowTertiary: isDark
          ? '0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 6px -1px rgba(0,0,0,0.2)'
          : '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02)',
      },
      Table: {
        headerBg: isDark ? '#1a1a1a' : '#fafafa',
        rowHoverBg: isDark ? '#262626' : '#f5f5f5',
        borderColor: isDark ? '#303030' : '#f0f0f0',
      },
      Button: {
        borderRadius: 6,
        controlHeight: 36,
      },
      Input: {
        borderRadius: 6,
        controlHeight: 36,
      },
      Select: {
        borderRadius: 6,
        controlHeight: 36,
      },
      Modal: {
        borderRadiusLG: 12,
      },
    },
  }), [isDark, primaryColor, fontSize])

  return (
    <ConfigProvider locale={zhCN} theme={antdTheme}>
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  )
}

export default ThemeProvider
