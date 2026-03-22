import { useEffect, useState } from 'react'
import {
  Card,
  Button,
  Tabs,
  Row,
  Col,
  Modal,
  Form,
  Input,
  Tag,
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useCategoryStore } from '@stores/categoryStore'
import { useMessage } from '@hooks/useMessage'
import type { Category, Tag as TagType, CreateCategoryRequest, CreateTagRequest } from '@types'
import styles from './Categories.module.less'

const predefinedColors = [
  '#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1',
  '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb',
]

const Categories: React.FC = () => {
  const {
    categories,
    tags,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchTags,
    createTag,
    deleteTag,
  } = useCategoryStore()

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingTag, setEditingTag] = useState<TagType | null>(null)
  const [categoryForm] = Form.useForm()
  const [tagForm] = Form.useForm()
  const message = useMessage()

  useEffect(() => {
    fetchCategories()
    fetchTags()
  }, [fetchCategories, fetchTags])

  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      categoryForm.setFieldsValue({
        name: category.name,
        color: category.color,
        icon: category.icon || '',
      })
    } else {
      setEditingCategory(null)
      categoryForm.resetFields()
      categoryForm.setFieldsValue({ color: predefinedColors[0] })
    }
    setCategoryDialogOpen(true)
  }

  const handleCloseCategoryDialog = () => {
    setCategoryDialogOpen(false)
    setEditingCategory(null)
    categoryForm.resetFields()
  }

  const handleSubmitCategory = async () => {
    try {
      const values = await categoryForm.validateFields()
      if (editingCategory) {
        await updateCategory(editingCategory.id, values)
        message.success('更新成功')
      } else {
        await createCategory(values as CreateCategoryRequest)
        message.success('创建成功')
      }
      handleCloseCategoryDialog()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id)
      message.success('删除成功')
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleOpenTagDialog = (tag?: TagType) => {
    if (tag) {
      setEditingTag(tag)
      tagForm.setFieldsValue({
        name: tag.name,
        color: tag.color,
      })
    } else {
      setEditingTag(null)
      tagForm.resetFields()
      tagForm.setFieldsValue({ color: predefinedColors[0] })
    }
    setTagDialogOpen(true)
  }

  const handleCloseTagDialog = () => {
    setTagDialogOpen(false)
    setEditingTag(null)
    tagForm.resetFields()
  }

  const handleSubmitTag = async () => {
    try {
      const values = await tagForm.validateFields()
      if (editingTag) {
        message.info('标签更新功能开发中')
      } else {
        await createTag(values as CreateTagRequest)
        message.success('创建成功')
      }
      handleCloseTagDialog()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleDeleteTag = async (id: string) => {
    try {
      await deleteTag(id)
      message.success('删除成功')
    } catch (error) {
      message.error('删除失败')
    }
  }

  const categoryItems = [
    {
      key: 'categories',
      label: `分类 (${categories.length})`,
      children: (
        <div>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>分类列表</span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenCategoryDialog()}
            >
              新建分类
            </Button>
          </div>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {categories.map((category) => (
              <Col key={category.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  className={styles.itemCard}
                  actions={[
                    <Button
                      key="edit"
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleOpenCategoryDialog(category)}
                    />,
                    <Popconfirm
                      key="delete"
                      title="确定要删除这个分类吗？"
                      onConfirm={() => handleDeleteCategory(category.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>,
                  ]}
                >
                  <div className={styles.itemContent}>
                    <div
                      className={styles.colorDot}
                      style={{ backgroundColor: category.color }}
                    />
                    <span className={styles.itemName}>{category.name}</span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ),
    },
    {
      key: 'tags',
      label: `标签 (${tags.length})`,
      children: (
        <div>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>标签列表</span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenTagDialog()}
            >
              新建标签
            </Button>
          </div>
          <div className={styles.tagList}>
            {tags.map((tag) => (
              <Tag
                key={tag.id}
                color={tag.color}
                closable
                onClose={(e) => {
                  e.preventDefault()
                  handleDeleteTag(tag.id)
                }}
                style={{ margin: 4 }}
              >
                {tag.name}
              </Tag>
            ))}
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className={styles.container}>
      <Card>
        <Tabs items={categoryItems} />
      </Card>

      <Modal
        title={editingCategory ? '编辑分类' : '新建分类'}
        open={categoryDialogOpen}
        onCancel={handleCloseCategoryDialog}
        onOk={handleSubmitCategory}
        destroyOnHidden
      >
        <Form form={categoryForm} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item name="color" label="颜色" initialValue={predefinedColors[0]}>
            <div className={styles.colorPicker}>
              {predefinedColors.map((color) => (
                <div
                  key={color}
                  className={`${styles.colorOption} ${
                    categoryForm.getFieldValue('color') === color
                      ? styles.colorSelected
                      : ''
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => categoryForm.setFieldsValue({ color })}
                />
              ))}
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingTag ? '编辑标签' : '新建标签'}
        open={tagDialogOpen}
        onCancel={handleCloseTagDialog}
        onOk={handleSubmitTag}
        destroyOnHidden
      >
        <Form form={tagForm} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="标签名称"
            rules={[{ required: true, message: '请输入标签名称' }]}
          >
            <Input placeholder="请输入标签名称" />
          </Form.Item>
          <Form.Item name="color" label="颜色" initialValue={predefinedColors[0]}>
            <div className={styles.colorPicker}>
              {predefinedColors.map((color) => (
                <div
                  key={color}
                  className={`${styles.colorOption} ${
                    tagForm.getFieldValue('color') === color
                      ? styles.colorSelected
                      : ''
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => tagForm.setFieldsValue({ color })}
                />
              ))}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Categories
