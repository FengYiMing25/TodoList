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
  Paper,
  Grid,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AccountBalance as BalanceIcon,
} from '@mui/icons-material'
import { useAccountStore } from '@stores/accountStore'
import type { Account, CreateAccountRequest, UpdateAccountRequest, AccountType } from '@types'
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@types'
import styles from './AccountBook.module.less'

const AccountBook: React.FC = () => {
  const {
    accounts,
    total,
    summary,
    queryParams,
    isLoading,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    setQueryParams,
  } = useAccountStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateAccountRequest>({
    type: 'expense',
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const getCategories = (type: AccountType) => {
    return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  }

  const handleOpenDialog = (account?: Account) => {
    if (account) {
      setEditingAccount(account)
      setFormData({
        type: account.type,
        category: account.category,
        amount: account.amount,
        description: account.description || '',
        date: account.date.split('T')[0],
      })
    } else {
      setEditingAccount(null)
      setFormData({
        type: 'expense',
        category: '',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingAccount(null)
  }

  const handleSubmit = async () => {
    if (!formData.category || formData.amount <= 0) return

    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, formData as UpdateAccountRequest)
      } else {
        await createAccount(formData)
      }
      handleCloseDialog()
      fetchAccounts()
    } catch (error) {
      console.error('Failed to save account:', error)
    }
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (selectedAccountId) {
      await deleteAccount(selectedAccountId)
    }
    setDeleteDialogOpen(false)
    setAnchorEl(null)
    setSelectedAccountId(null)
  }

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false)
  }

  const handlePageChange = (_: unknown, page: number) => {
    setQueryParams({ page: page + 1 })
    fetchAccounts({ ...queryParams, page: page + 1 })
  }

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const limit = parseInt(e.target.value, 10)
    setQueryParams({ limit, page: 1 })
    fetchAccounts({ ...queryParams, limit, page: 1 })
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, accountId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedAccountId(accountId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedAccountId(null)
  }

  const formatAmount = (amount: number, type: AccountType) => {
    return type === 'income' ? `+${amount.toFixed(2)}` : `-${amount.toFixed(2)}`
  }

  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Typography variant="h4" className={styles.pageTitle}>
          记账本
        </Typography>
        <Box className={styles.actions}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            筛选
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} className={styles.summaryGrid}>
        <Grid item xs={12} sm={4}>
          <Paper className={styles.summaryCard}>
            <Box className={styles.summaryContent}>
              <IncomeIcon className={styles.incomeIcon} />
              <Box>
                <Typography variant="body2" color="textSecondary">
                  收入
                </Typography>
                <Typography variant="h5" className={styles.incomeText}>
                  ¥{summary.income.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper className={styles.summaryCard}>
            <Box className={styles.summaryContent}>
              <ExpenseIcon className={styles.expenseIcon} />
              <Box>
                <Typography variant="body2" color="textSecondary">
                  支出
                </Typography>
                <Typography variant="h5" className={styles.expenseText}>
                  ¥{summary.expense.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper className={styles.summaryCard}>
            <Box className={styles.summaryContent}>
              <BalanceIcon className={styles.balanceIcon} />
              <Box>
                <Typography variant="body2" color="textSecondary">
                  结余
                </Typography>
                <Typography variant="h5" className={summary.balance >= 0 ? styles.incomeText : styles.expenseText}>
                  ¥{summary.balance.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {filterOpen && (
        <Card className={styles.filterCard}>
          <CardContent>
            <Box className={styles.filterRow}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>类型</InputLabel>
                <Select
                  value={queryParams.type || ''}
                  label="类型"
                  onChange={(e) => setQueryParams({ type: e.target.value as AccountType || undefined })}
                >
                  <MenuItem value="">全部</MenuItem>
                  <MenuItem value="income">收入</MenuItem>
                  <MenuItem value="expense">支出</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="开始日期"
                type="date"
                size="small"
                value={queryParams.startDate || ''}
                onChange={(e) => setQueryParams({ startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="结束日期"
                type="date"
                size="small"
                value={queryParams.endDate || ''}
                onChange={(e) => setQueryParams({ endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <Button variant="contained" onClick={() => fetchAccounts()}>
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
                <TableCell>日期</TableCell>
                <TableCell>类型</TableCell>
                <TableCell>分类</TableCell>
                <TableCell>金额</TableCell>
                <TableCell>备注</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id} hover>
                  <TableCell>
                    {new Date(account.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={account.type === 'income' ? '收入' : '支出'}
                      color={account.type === 'income' ? 'success' : 'error'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={account.category}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      className={account.type === 'income' ? styles.incomeText : styles.expenseText}
                      fontWeight="bold"
                    >
                      {formatAmount(account.amount, account.type)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {account.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, account.id)}>
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
        <DialogTitle>{editingAccount ? '编辑记录' : '新建记录'}</DialogTitle>
        <DialogContent>
          <Box className={styles.form}>
            <FormControl fullWidth margin="normal">
              <InputLabel>类型</InputLabel>
              <Select
                value={formData.type}
                label="类型"
                onChange={(e) => {
                  const newType = e.target.value as AccountType
                  setFormData({ ...formData, type: newType, category: '' })
                }}
              >
                <MenuItem value="income">收入</MenuItem>
                <MenuItem value="expense">支出</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>分类</InputLabel>
              <Select
                value={formData.category}
                label="分类"
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {getCategories(formData.type).map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="金额"
              type="number"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              margin="normal"
              inputProps={{ min: 0, step: '0.01' }}
            />
            <TextField
              fullWidth
              label="日期"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="备注"
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isLoading}>
            {editingAccount ? '保存' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            const account = accounts.find((a) => a.id === selectedAccountId)
            if (account) handleOpenDialog(account)
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
          <Typography>确定要删除这条记账记录吗？此操作不可撤销。</Typography>
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

export default AccountBook
