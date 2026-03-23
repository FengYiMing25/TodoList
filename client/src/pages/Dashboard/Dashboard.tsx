import { useEffect, useMemo } from 'react'
import { Card, Row, Col, Statistic, List, Tag, Typography, Space, theme, Progress } from 'antd'
import {
  CheckCircleOutlined,
  WalletOutlined,
  RiseOutlined,
  FallOutlined,
  SkinOutlined,
  FlagOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useTodoStore } from '@stores/todoStore'
import { useDictionaryStore } from '@stores/dictionaryStore'
import { useAccountStore } from '@stores/accountStore'
import { useWardrobeStore } from '@stores/wardrobeStore'
import PageTitle from '@components/PageTitle'
import styles from './Dashboard.module.less'

const { Text } = Typography

const Dashboard: React.FC = () => {
  const { token } = theme.useToken()
  const { todos, fetchTodos } = useTodoStore()
  const { fetchDictionaries } = useDictionaryStore()
  const { summary, statistics, fetchAccounts, fetchStatistics } = useAccountStore()
  const { statistics: wardrobeStats, fetchStatistics: fetchWardrobeStats } = useWardrobeStore()

  useEffect(() => {
    fetchTodos()
    fetchDictionaries('todo_category')
    fetchDictionaries('todo_tag')
    fetchAccounts({ limit: 100 })
    fetchStatistics()
    fetchWardrobeStats()
  }, [fetchTodos, fetchDictionaries, fetchAccounts, fetchStatistics, fetchWardrobeStats])

  const completedCount = todos.filter((t) => t.status === 'completed').length
  const pendingCount = todos.filter((t) => t.status === 'pending').length
  const inProgressCount = todos.filter((t) => t.status === 'in_progress').length
  const highPriorityCount = todos.filter((t) => t.priority === 'high' && t.status !== 'completed').length
  const todoTotal = todos.length
  const todoCompletionRate = todoTotal > 0 ? Math.round((completedCount / todoTotal) * 100) : 0

  const recentTodos = todos.slice(0, 5)

  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      completed: { color: 'success', text: '已完成' },
      in_progress: { color: 'processing', text: '进行中' },
      pending: { color: 'default', text: '待处理' },
    }
    return config[status] || config.pending
  }

  const todoStatusChartOption = useMemo(() => ({
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['35%', '60%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: [
        { value: completedCount, name: '已完成', itemStyle: { color: token.colorSuccess } },
        { value: inProgressCount, name: '进行中', itemStyle: { color: token.colorWarning } },
        { value: pendingCount, name: '待处理', itemStyle: { color: token.colorPrimary } },
      ],
    }],
  }), [completedCount, inProgressCount, pendingCount, token])

  const expenseChartOption = useMemo(() => {
    const monthlyData = statistics?.byMonth || []
    const incomeByMonth: Record<string, number> = {}
    const expenseByMonth: Record<string, number> = {}
    const months: string[] = []

    monthlyData.forEach((d) => {
      if (!months.includes(d.month)) {
        months.push(d.month)
      }
      if (d.type === 'income') {
        incomeByMonth[d.month] = d.total
      } else {
        expenseByMonth[d.month] = d.total
      }
    })

    return {
      tooltip: { trigger: 'axis', textStyle: { fontSize: 11 } },
      legend: { data: ['收入', '支出'], bottom: '0%', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
      grid: { left: '3%', right: '3%', bottom: '18%', top: '8%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: months, axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
      series: [
        {
          name: '收入',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: months.map((m) => incomeByMonth[m] || 0),
          itemStyle: { color: token.colorSuccess },
          areaStyle: { color: `${token.colorSuccess}20` },
        },
        {
          name: '支出',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: months.map((m) => expenseByMonth[m] || 0),
          itemStyle: { color: token.colorError },
          areaStyle: { color: `${token.colorError}20` },
        },
      ],
    }
  }, [statistics, token])

  const wardrobeCategoryChartOption = useMemo(() => {
    const categoryData: { name: string; value: number }[] = []
    const categoryMap: Record<string, number> = {}

    wardrobeStats?.categoryStats?.forEach(stat => {
      categoryMap[stat.category] = stat.count
    })

    Object.entries(categoryMap).forEach(([name, value]) => {
      if (value > 0) {
        categoryData.push({ name, value })
      }
    })

    return {
      tooltip: { trigger: 'item', textStyle: { fontSize: 11 } },
      legend: { bottom: '0%', left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
      series: [{
        type: 'pie',
        radius: '55%',
        center: ['50%', '42%'],
        data: categoryData.length > 0 ? categoryData : [{ name: '暂无数据', value: 1 }],
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
        label: { fontSize: 10 },
      }],
    }
  }, [wardrobeStats])

  return (
    <div className={styles.container}>
      <PageTitle title="数据概览" emoji="📊" />

      <Row gutter={[12, 12]}>
        <Col xs={12} sm={12} lg={6}>
          <Card className={styles.statCard} hoverable>
            <div className={styles.statHeader}>
              <div className={styles.statIcon} style={{ background: `${token.colorPrimary}15` }}>
                <CheckCircleOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
              </div>
              <div className={styles.statTitle}>📋 待办事项</div>
            </div>
            <div className={styles.statValue}>{todoTotal}</div>
            <div className={styles.statFooter}>
              <Progress percent={todoCompletionRate} size="small" showInfo={false} strokeColor={token.colorSuccess} />
              <span>完成率 {todoCompletionRate}%</span>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card className={styles.statCard} hoverable>
            <div className={styles.statHeader}>
              <div className={styles.statIcon} style={{ background: `${token.colorSuccess}15` }}>
                <WalletOutlined style={{ color: token.colorSuccess, fontSize: 20 }} />
              </div>
              <div className={styles.statTitle}>💰 本月结余</div>
            </div>
            <div className={styles.statValue}>¥{(summary.balance || 0).toFixed(0)}</div>
            <div className={styles.statFooter}>
              <Space size={4}>
                <span><RiseOutlined style={{ color: token.colorSuccess, fontSize: 10 }} />{summary.income?.toFixed(0)}</span>
                <span><FallOutlined style={{ color: token.colorError, fontSize: 10 }} />{summary.expense?.toFixed(0)}</span>
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card className={styles.statCard} hoverable>
            <div className={styles.statHeader}>
              <div className={styles.statIcon} style={{ background: `${token.colorWarning}15` }}>
                <SkinOutlined style={{ color: token.colorWarning, fontSize: 20 }} />
              </div>
              <div className={styles.statTitle}>👗 电子衣橱</div>
            </div>
            <div className={styles.statValue}>{wardrobeStats?.totalItems || 0}</div>
            <div className={styles.statFooter}>
              <Space size={4}>
                <span>使用{wardrobeStats?.inUseCount || 0}</span>
                <span>出库{wardrobeStats?.discardedCount || 0}</span>
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card className={styles.statCard} hoverable>
            <div className={styles.statHeader}>
              <div className={styles.statIcon} style={{ background: `${token.colorError}15` }}>
                <FlagOutlined style={{ color: token.colorError, fontSize: 20 }} />
              </div>
              <div className={styles.statTitle}>🚨 高优先级</div>
            </div>
            <div className={styles.statValue}>{highPriorityCount}</div>
            <div className={styles.statFooter}>
              <span>需优先处理</span>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]} className={styles.chartRow}>
        <Col xs={24} sm={24} lg={8}>
          <Card
            title={
              <Space size={4}>
                <span className={styles.cardTitle}>🎯 待办状态分布</span>
              </Space>
            }
            className={styles.chartCard}
          >
            <ReactECharts
              option={todoStatusChartOption}
              style={{ height: 220 }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} lg={8}>
          <Card
            title={
              <Space size={4}>
                <span className={styles.cardTitle}>👚 衣橱分类统计</span>
              </Space>
            }
            className={styles.chartCard}
          >
            <ReactECharts
              option={wardrobeCategoryChartOption}
              style={{ height: 220 }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} lg={8}>
          <Card
            title={
              <Space size={4}>
                <span className={styles.cardTitle}>📈 收支趋势</span>
              </Space>
            }
            className={styles.chartCard}
          >
            <ReactECharts
              option={expenseChartOption}
              style={{ height: 220 }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]} className={styles.chartRow}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space size={4}>
                <span className={styles.cardTitle}>⏰ 最近待办</span>
              </Space>
            }
            className={styles.card}
          >
            {recentTodos.length > 0 ? (
              <List
                dataSource={recentTodos}
                renderItem={(todo) => {
                  const statusConfig = getStatusTag(todo.status)
                  return (
                    <List.Item className={styles.listItem}>
                      <List.Item.Meta
                        title={
                          <Space size={4}>
                            <Text
                              delete={todo.status === 'completed'}
                              className={styles.todoTitle}
                              style={{
                                color: todo.status === 'completed' ? token.colorTextDisabled : 'inherit',
                              }}
                            >
                              {todo.title}
                            </Text>
                            {todo.category && (
                              <Tag color={todo.category.color} className={styles.categoryTag}>
                                {todo.category.name}
                              </Tag>
                            )}
                          </Space>
                        }
                        description={todo.description ? <Text className={styles.todoDesc} ellipsis>{todo.description}</Text> : undefined}
                      />
                      <Tag color={statusConfig.color} className={styles.statusTag}>{statusConfig.text}</Tag>
                    </List.Item>
                  )
                }}
              />
            ) : (
              <div className={styles.empty}>暂无待办事项</div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space size={4}>
                <span className={styles.cardTitle}>💎 衣橱价值统计</span>
              </Space>
            }
            className={styles.card}
          >
            <Row gutter={[12, 12]}>
              <Col xs={12} sm={12}>
                <Statistic
                  title={<span className={styles.statLabel}>💵 总价值</span>}
                  value={wardrobeStats?.totalValue || 0}
                  precision={2}
                  suffix="元"
                  valueStyle={{ color: token.colorPrimary, fontSize: 20 }}
                />
              </Col>
              <Col xs={12} sm={12}>
                <Statistic
                  title={<span className={styles.statLabel}>📅 平均使用</span>}
                  value={wardrobeStats?.avgUsageDays || 0}
                  suffix="天"
                  valueStyle={{ color: token.colorSuccess, fontSize: 20 }}
                />
              </Col>
              <Col xs={12} sm={12}>
                <Statistic
                  title={<span className={styles.statLabel}>✨ 使用中</span>}
                  value={wardrobeStats?.inUseCount || 0}
                  suffix="件"
                  valueStyle={{ fontSize: 20 }}
                />
              </Col>
              <Col xs={12} sm={12}>
                <Statistic
                  title={<span className={styles.statLabel}>📦 已出库</span>}
                  value={wardrobeStats?.discardedCount || 0}
                  suffix="件"
                  valueStyle={{ fontSize: 20 }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
