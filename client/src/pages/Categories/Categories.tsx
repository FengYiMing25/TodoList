import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Tabs,
  Tab,
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useCategoryStore } from '@stores/categoryStore'
import type { Category, Tag, CreateCategoryRequest, CreateTagRequest } from '@types'
import styles from './Categories.module.less'

const predefinedColors = [
  '#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1',
  '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb',
]

interface CategoryFormData {
  name: string
  color: string
  icon: string
}

interface TagFormData {
  name: string
  color: string
}

const Categories: React.FC = () => {
  const {
    categories,
    tags,
    isLoading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchTags,
    createTag,
    deleteTag,
  } = useCategoryStore()

  const [tabValue, setTabValue] = useState(0)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)

  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: '',
    color: predefinedColors[0],
    icon: '',
  })

  const [tagForm, setTagForm] = useState<TagFormData>({
    name: '',
    color: predefinedColors[0],
  })

  useEffect(() => {
    fetchCategories()
    fetchTags()
  }, [fetchCategories, fetchTags])

  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({
        name: category.name,
        color: category.color,
        icon: category.icon || '',
      })
    } else {
      setEditingCategory(null)
      setCategoryForm({ name: '', color: predefinedColors[0], icon: '' })
    }
    setCategoryDialogOpen(true)
  }

  const handleCloseCategoryDialog = () => {
    setCategoryDialogOpen(false)
    setEditingCategory(null)
  }

  const handleSubmitCategory = async () => {
    if (!categoryForm.name.trim()) return

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryForm)
      } else {
        await createCategory(categoryForm as CreateCategoryRequest)
      }
      handleCloseCategoryDialog()
    } catch (error) {
      console.error('Failed to save category:', error)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('确定要删除这个分类吗？')) {
      await deleteCategory(id)
    }
  }

  const handleOpenTagDialog = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag)
      setTagForm({ name: tag.name, color: tag.color })
    } else {
      setEditingTag(null)
      setTagForm({ name: '', color: predefinedColors[0] })
    }
    setTagDialogOpen(true)
  }

  const handleCloseTagDialog = () => {
    setTagDialogOpen(false)
    setEditingTag(null)
  }

  const handleSubmitTag = async () => {
    if (!tagForm.name.trim()) return

    try {
      if (editingTag) {
        console.log('Update tag:', editingTag.id, tagForm)
      } else {
        await createTag(tagForm as CreateTagRequest)
      }
      handleCloseTagDialog()
    } catch (error) {
      console.error('Failed to save tag:', error)
    }
  }

  const handleDeleteTag = async (id: string) => {
    if (window.confirm('确定要删除这个标签吗？')) {
      await deleteTag(id)
    }
  }

  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Typography variant="h4" className={styles.pageTitle}>
          分类管理
        </Typography>
      </Box>

      <Card>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label={`分类 (${categories.length})`} />
          <Tab label={`标签 (${tags.length})`} />
        </Tabs>

        <CardContent>
          {tabValue === 0 && (
            <Box>
              <Box className={styles.sectionHeader}>
                <Typography variant="h6">分类列表</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenCategoryDialog()}
                >
                  新建分类
                </Button>
              </Box>
              <Grid container spacing={2}>
                {categories.map((category) => (
                  <Grid item key={category.id} xs={12} sm={6} md={4}>
                    <Card className={styles.itemCard}>
                      <CardContent className={styles.itemContent}>
                        <Box className={styles.itemHeader}>
                          <Box
                            className={styles.colorDot}
                            style={{ backgroundColor: category.color }}
                          />
                          <Typography variant="subtitle1" className={styles.itemName}>
                            {category.name}
                          </Typography>
                        </Box>
                        <Box className={styles.itemActions}>
                          <IconButton size="small" onClick={() => handleOpenCategoryDialog(category)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteCategory(category.id)}>
                            <DeleteIcon fontSize="small" color="error" />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Box className={styles.sectionHeader}>
                <Typography variant="h6">标签列表</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenTagDialog()}
                >
                  新建标签
                </Button>
              </Box>
              <Box className={styles.tagList}>
                {tags.map((tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.name}
                    onDelete={() => handleDeleteTag(tag.id)}
                    onClick={() => handleOpenTagDialog(tag)}
                    style={{ backgroundColor: tag.color, color: '#fff', margin: 4 }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={categoryDialogOpen} onClose={handleCloseCategoryDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCategory ? '编辑分类' : '新建分类'}</DialogTitle>
        <DialogContent>
          <Box className={styles.form}>
            <TextField
              fullWidth
              label="分类名称"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              margin="normal"
            />
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              选择颜色
            </Typography>
            <Box className={styles.colorPicker}>
              {predefinedColors.map((color) => (
                <Box
                  key={color}
                  className={`${styles.colorOption} ${categoryForm.color === color ? styles.colorSelected : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setCategoryForm({ ...categoryForm, color })}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCategoryDialog}>取消</Button>
          <Button variant="contained" onClick={handleSubmitCategory} disabled={isLoading}>
            {editingCategory ? '保存' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={tagDialogOpen} onClose={handleCloseTagDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTag ? '编辑标签' : '新建标签'}</DialogTitle>
        <DialogContent>
          <Box className={styles.form}>
            <TextField
              fullWidth
              label="标签名称"
              value={tagForm.name}
              onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
              margin="normal"
            />
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              选择颜色
            </Typography>
            <Box className={styles.colorPicker}>
              {predefinedColors.map((color) => (
                <Box
                  key={color}
                  className={`${styles.colorOption} ${tagForm.color === color ? styles.colorSelected : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setTagForm({ ...tagForm, color })}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTagDialog}>取消</Button>
          <Button variant="contained" onClick={handleSubmitTag} disabled={isLoading}>
            {editingTag ? '保存' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Categories
