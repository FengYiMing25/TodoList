import { useEffect } from 'react'
import { Box, Card, CardContent, Typography, Grid, Chip } from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
} from '@mui/icons-material'
import { useTodoStore } from '@stores/todoStore'
import { useCategoryStore } from '@stores/categoryStore'
import styles from './Dashboard.module.less'

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card className={styles.statCard}>
    <CardContent>
      <Box className={styles.statContent}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" className={styles.statValue}>
            {value}
          </Typography>
        </Box>
        <Box className={styles.statIcon} style={{ backgroundColor: `${color}20`, color }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

const Dashboard: React.FC = () => {
  const { todos, fetchTodos } = useTodoStore()
  const { categories, fetchCategories } = useCategoryStore()

  useEffect(() => {
    fetchTodos()
    fetchCategories()
  }, [fetchTodos, fetchCategories])

  const completedCount = todos.filter((t) => t.status === 'completed').length
  const pendingCount = todos.filter((t) => t.status === 'pending').length
  const inProgressCount = todos.filter((t) => t.status === 'in_progress').length
  const highPriorityCount = todos.filter((t) => t.priority === 'high' && t.status !== 'completed').length

  const recentTodos = todos.slice(0, 5)

  return (
    <Box className={styles.container}>
      <Typography variant="h4" className={styles.pageTitle}>
        仪表盘
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="已完成"
            value={completedCount}
            icon={<CheckCircleIcon />}
            color="#52c41a"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="待处理"
            value={pendingCount}
            icon={<PendingIcon />}
            color="#1890ff"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="进行中"
            value={inProgressCount}
            icon={<ScheduleIcon />}
            color="#faad14"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="高优先级"
            value={highPriorityCount}
            icon={<FlagIcon />}
            color="#ff4d4f"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                最近待办
              </Typography>
              {recentTodos.length > 0 ? (
                <Box className={styles.todoList}>
                  {recentTodos.map((todo) => (
                    <Box key={todo.id} className={styles.todoItem}>
                      <Box className={styles.todoInfo}>
                        <Typography variant="body1">{todo.title}</Typography>
                        {todo.category && (
                          <Chip
                            size="small"
                            label={todo.category.name}
                            style={{ backgroundColor: todo.category.color, color: '#fff' }}
                          />
                        )}
                      </Box>
                      <Chip
                        size="small"
                        label={
                          todo.status === 'completed'
                            ? '已完成'
                            : todo.status === 'in_progress'
                              ? '进行中'
                              : '待处理'
                        }
                        color={
                          todo.status === 'completed'
                            ? 'success'
                            : todo.status === 'in_progress'
                              ? 'warning'
                              : 'default'
                        }
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">暂无待办事项</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                分类统计
              </Typography>
              {categories.length > 0 ? (
                <Box className={styles.categoryList}>
                  {categories.map((category) => {
                    const count = todos.filter((t) => t.categoryId === category.id).length
                    return (
                      <Box key={category.id} className={styles.categoryItem}>
                        <Box className={styles.categoryInfo}>
                          <Box
                            className={styles.categoryDot}
                            style={{ backgroundColor: category.color }}
                          />
                          <Typography>{category.name}</Typography>
                        </Box>
                        <Typography color="text.secondary">{count}</Typography>
                      </Box>
                    )
                  })}
                </Box>
              ) : (
                <Typography color="text.secondary">暂无分类</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard
