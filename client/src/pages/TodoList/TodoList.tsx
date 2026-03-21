import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  GetApp as ExportIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material'
import { useTodoStore } from '@stores/todoStore'
import { useCategoryStore } from '@stores/categoryStore'
import type { Todo, CreateTodoRequest, UpdateTodoRequest, Priority, TodoStatus } from '@types'
import styles from './TodoList.module.less'

const priorityColors: Record<Priority, string> = {
  low: '#52c41a',
  medium: '#faad14',
  high: '#ff4d4f',
}

const priorityLabels: Record<Priority, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

const statusLabels: Record<TodoStatus, string> = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
}

const TodoList: React.FC = () => {
  const {
    todos,
    total,
    queryParams,
    isLoading,
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodoStatus,
    setQueryParams,
  } = useTodoStore()
  const { categories, fetchCategories, fetchTags } = useCategoryStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateTodoRequest>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    categoryId: '',
    tagIds: [],
  })

  useEffect(() => {
    fetchTodos()
    fetchCategories()
    fetchTags()
  }, [fetchTodos, fetchCategories, fetchTags])

  const handleOpenDialog = (todo?: Todo) => {
    if (todo) {
      setEditingTodo(todo)
      setFormData({
        title: todo.title,
        description: todo.description || '',
        priority: todo.priority,
        dueDate: todo.dueDate?.split('T')[0] || '',
        categoryId: todo.categoryId || '',
        tagIds: todo.tags.map((t) => t.id),
      })
    } else {
      setEditingTodo(null)
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        categoryId: '',
        tagIds: [],
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingTodo(null)
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) return

    try {
      if (editingTodo) {
        await updateTodo(editingTodo.id, formData as UpdateTodoRequest)
      } else {
        await createTodo(formData)
      }
      handleCloseDialog()
      fetchTodos()
    } catch (error) {
      console.error('Failed to save todo:', error)
    }
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (selectedTodoId) {
      await deleteTodo(selectedTodoId)
    }
    setDeleteDialogOpen(false)
    setAnchorEl(null)
    setSelectedTodoId(null)
  }

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false)
  }

  const handlePageChange = (_: unknown, page: number) => {
    setQueryParams({ page: page + 1 })
    fetchTodos({ ...queryParams, page: page + 1 })
  }

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const limit = parseInt(e.target.value, 10)
    setQueryParams({ limit, page: 1 })
    fetchTodos({ ...queryParams, limit, page: 1 })
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, todoId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedTodoId(todoId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedTodoId(null)
  }

  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Typography variant="h4" className={styles.pageTitle}>
          待办事项
        </Typography>
        <Box className={styles.actions}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            筛选
          </Button>
          <Button variant="outlined" startIcon={<ExportIcon />}>
            导出
          </Button>
        </Box>
      </Box>

      {filterOpen && (
        <Card className={styles.filterCard}>
          <CardContent>
            <Box className={styles.filterRow}>
              <TextField
                label="关键词"
                size="small"
                value={queryParams.keyword || ''}
                onChange={(e) => setQueryParams({ keyword: e.target.value })}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>状态</InputLabel>
                <Select
                  value={queryParams.status || ''}
                  label="状态"
                  onChange={(e) => setQueryParams({ status: e.target.value as TodoStatus || undefined })}
                >
                  <MenuItem value="">全部</MenuItem>
                  <MenuItem value="pending">待处理</MenuItem>
                  <MenuItem value="in_progress">进行中</MenuItem>
                  <MenuItem value="completed">已完成</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>优先级</InputLabel>
                <Select
                  value={queryParams.priority || ''}
                  label="优先级"
                  onChange={(e) => setQueryParams({ priority: e.target.value as Priority || undefined })}
                >
                  <MenuItem value="">全部</MenuItem>
                  <MenuItem value="high">高</MenuItem>
                  <MenuItem value="medium">中</MenuItem>
                  <MenuItem value="low">低</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>分类</InputLabel>
                <Select
                  value={queryParams.categoryId || ''}
                  label="分类"
                  onChange={(e) => setQueryParams({ categoryId: e.target.value || undefined })}
                >
                  <MenuItem value="">全部</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="contained" onClick={() => fetchTodos()}>
                搜索
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>标题</TableCell>
                <TableCell>分类</TableCell>
                <TableCell>优先级</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>截止日期</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {todos.map((todo) => (
                <TableRow key={todo.id} hover>
                  <TableCell padding="checkbox">
                    <IconButton size="small" onClick={() => toggleTodoStatus(todo.id)}>
                      {todo.status === 'completed' ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <UncheckIcon />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Typography
                      className={styles.todoTitle}
                      sx={{ textDecoration: todo.status === 'completed' ? 'line-through' : 'none' }}
                    >
                      {todo.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {todo.category && (
                      <Chip
                        size="small"
                        label={todo.category.name}
                        style={{ backgroundColor: todo.category.color, color: '#fff' }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={priorityLabels[todo.priority]}
                      style={{ backgroundColor: priorityColors[todo.priority], color: '#fff' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={statusLabels[todo.status]}
                      variant={todo.status === 'completed' ? 'filled' : 'outlined'}
                      color={
                        todo.status === 'completed'
                          ? 'success'
                          : todo.status === 'in_progress'
                            ? 'warning'
                            : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {todo.dueDate && new Date(todo.dueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, todo.id)}>
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={(queryParams.page || 1) - 1}
          rowsPerPage={queryParams.limit || 10}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="每页行数"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count} 条`}
        />
      </Card>

      <Fab
        color="primary"
        className={styles.fab}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTodo ? '编辑待办' : '新建待办'}</DialogTitle>
        <DialogContent>
          <Box className={styles.form}>
            <TextField
              fullWidth
              label="标题"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="描述"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>优先级</InputLabel>
              <Select
                value={formData.priority}
                label="优先级"
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
              >
                <MenuItem value="low">低</MenuItem>
                <MenuItem value="medium">中</MenuItem>
                <MenuItem value="high">高</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>分类</InputLabel>
              <Select
                value={formData.categoryId}
                label="分类"
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <MenuItem value="">无</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="截止日期"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isLoading}>
            {editingTodo ? '保存' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            const todo = todos.find((t) => t.id === selectedTodoId)
            if (todo) handleOpenDialog(todo)
            handleMenuClose()
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>编辑</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose()
          handleDelete()
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>删除</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>确定要删除这个待办事项吗？此操作不可撤销。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>取消</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TodoList
