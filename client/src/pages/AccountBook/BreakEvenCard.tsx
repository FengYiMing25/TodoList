import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Space, Typography, Progress, Tooltip } from 'antd'
import {
  CalculatorOutlined,
  TrophyOutlined,
  FireOutlined,
  RocketOutlined,
  CoffeeOutlined,
  HeartOutlined,
  StarOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@stores/authStore'
import styles from './BreakEvenCard.module.less'

const { Text, Title } = Typography

interface BreakEvenCardProps {
  totalIncome: number
  totalExpense: number
}

const BreakEvenCard: React.FC<BreakEvenCardProps> = ({ totalIncome, totalExpense }) => {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const monthSalary = user?.monthSalary || 0
  const dailyExpense = user?.dailyExpense || 0
  const dailySalary = monthSalary > 0 ? Math.round(monthSalary / 22) : 0
  const dailyNet = dailySalary - dailyExpense

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()

  const actualTotalIncome = totalIncome + monthSalary
  const actualTotalExpense = totalExpense + (dailyExpense * daysInMonth)

  const result = useMemo(() => {
    const balance = actualTotalIncome - actualTotalExpense

    if (monthSalary === 0 || dailyExpense === 0) {
      return {
        days: 0,
        message: '💡 请先在系统设置中配置月工资和日均支出哦～',
        emoji: '⚙️',
        color: '#1890ff',
        icon: <CalculatorOutlined />,
        showConfig: true,
      }
    }

    if (dailyNet <= 0) {
      return {
        days: Infinity,
        message: '💸 宝子，你每天花的比赚的还多，这辈子是回不了本啦～快去搬砖吧！🧱',
        emoji: '😭',
        color: '#ff4d4f',
        icon: <HeartOutlined />,
      }
    }

    if (balance >= 0) {
      return {
        days: 0,
        message: '🎉 哇塞！你已经回本啦！简直是理财小天才！💰✨ 继续保持，早日实现财富自由！🚀',
        emoji: '🥳',
        color: '#52c41a',
        icon: <TrophyOutlined />,
      }
    }

    const daysNeeded = Math.ceil(Math.abs(balance) / dailyNet)

    if (daysNeeded <= 7) {
      return {
        days: daysNeeded,
        message: `🌟 只要 ${daysNeeded} 天就能回本！加油鸭！你是最棒的！💪✨`,
        emoji: '🔥',
        color: '#faad14',
        icon: <FireOutlined />,
      }
    }

    if (daysNeeded <= 30) {
      return {
        days: daysNeeded,
        message: `☕ 还需要 ${daysNeeded} 天回本～小case啦！喝杯奶茶继续冲！🧋`,
        emoji: '😊',
        color: '#1890ff',
        icon: <CoffeeOutlined />,
      }
    }

    if (daysNeeded <= 90) {
      return {
        days: daysNeeded,
        message: `🚀 ${daysNeeded} 天后回本！虽然有点久，但是梦想还是要有的！💪`,
        emoji: '💪',
        color: '#722ed1',
        icon: <RocketOutlined />,
      }
    }

    if (daysNeeded <= 365) {
      return {
        days: daysNeeded,
        message: `😅 ${daysNeeded} 天...大概 ${Math.ceil(daysNeeded / 30)} 个月后回本...加油打工人！👷‍♂️✨`,
        emoji: '🤔',
        color: '#eb2f96',
        icon: <StarOutlined />,
      }
    }

    return {
      days: daysNeeded,
      message: `🌈 ${daysNeeded} 天回本，约等于 ${Math.ceil(daysNeeded / 365)} 年...宝子，加油！💕`,
      emoji: '🦄',
      color: '#13c2c2',
      icon: <StarOutlined />,
    }
  }, [actualTotalIncome, actualTotalExpense, monthSalary, dailyExpense, dailyNet])

  const progressPercent = useMemo(() => {
    if (result.days === Infinity || result.showConfig) return 0
    if (result.days === 0) return 100
    const maxDays = 365
    return Math.min(100, Math.round((1 - result.days / maxDays) * 100))
  }, [result])

  const handleTipClick = () => {
    navigate('/settings')
  }

  return (
    <Card
      className={styles.container}
      title={
        <Space>
          <CalculatorOutlined />
          <span>💰 回本计算器 🧮</span>
        </Space>
      }
    >
      <div className={styles.settingsInfo}>
        <div className={styles.settingItem}>
          <Text type="secondary">💵 月工资</Text>
          <Text strong style={{ color: '#ff4d4f' }}>¥{monthSalary.toLocaleString()}</Text>
        </div>
        <div className={styles.settingItem}>
          <Text type="secondary">📅 日薪（22天）</Text>
          <Text strong style={{ color: '#ff4d4f' }}>¥{dailySalary.toLocaleString()}</Text>
        </div>
        <div className={styles.settingItem}>
          <Text type="secondary">🛒 日均支出</Text>
          <Text strong style={{ color: '#52c41a' }}>¥{dailyExpense.toLocaleString()}</Text>
        </div>
        <div className={styles.settingItem}>
          <Text type="secondary">💎 每日结余</Text>
          <Text strong style={{ color: dailyNet > 0 ? '#ff4d4f' : '#52c41a' }}>
            ¥{dailyNet.toLocaleString()}
          </Text>
        </div>
      </div>

      <div className={styles.divider}>✨ ✨ ✨</div>

      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <Text type="secondary">📊 总收入</Text>
          <Text strong className={styles.income}>¥{actualTotalIncome.toFixed(0)}</Text>
          {monthSalary > 0 && (
            <Text type="secondary" style={{ fontSize: 10 }}>
              (记账 ¥{totalIncome.toFixed(0)} + 工资 ¥{monthSalary})
            </Text>
          )}
        </div>
        <div className={styles.statItem}>
          <Text type="secondary">📉 总支出</Text>
          <Text strong className={styles.expense}>¥{actualTotalExpense.toFixed(0)}</Text>
          {dailyExpense > 0 && (
            <Text type="secondary" style={{ fontSize: 10 }}>
              (记账 ¥{totalExpense.toFixed(0)} + 日均×{daysInMonth}天)
            </Text>
          )}
        </div>
        <div className={styles.statItem}>
          <Text type="secondary">💎 结余</Text>
          <Text strong style={{ color: result.color }}>
            ¥{(actualTotalIncome - actualTotalExpense).toFixed(0)}
          </Text>
        </div>
      </div>

      <div className={styles.resultCard} style={{ borderColor: result.color }}>
        <div className={styles.resultIcon} style={{ color: result.color }}>
          {result.icon}
          <span className={styles.emoji}>{result.emoji}</span>
        </div>
        <div className={styles.resultText}>
          {result.days !== Infinity && !result.showConfig && result.days > 0 && (
            <Title level={4} style={{ color: result.color, marginBottom: 8 }}>
              ⏰ 需要 {result.days} 天回本
            </Title>
          )}
          <Text className={styles.message}>{result.message}</Text>
          {!result.showConfig && result.days !== Infinity && (
            <Progress
              percent={progressPercent}
              strokeColor={result.color}
              showInfo={false}
              style={{ marginTop: 12 }}
            />
          )}
        </div>
      </div>

      <div className={styles.tips} onClick={handleTipClick}>
        <Tooltip title="点击前往设置">
          <Text type="secondary" className={styles.tipText}>
            💡 数据来源于系统设置，点击可修改月工资和日均支出
          </Text>
        </Tooltip>
      </div>
    </Card>
  )
}

export default BreakEvenCard
