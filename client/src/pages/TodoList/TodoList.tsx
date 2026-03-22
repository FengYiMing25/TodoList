import { useEffect, useState, useRef } from 'react'
import {
  Card,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Popconfirm,
  Tooltip,
  Badge,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { useTodoStore } from '@stores/todoStore'
import { useCategoryStore } from '@stores/categoryStore'
import { useMessage } from '@hooks/useMessage'
import type { Todo, CreateTodoRequest, UpdateTodoRequest, Priority, TodoStatus } from '@types'
import dayjs from 'dayjs'
import styles from './TodoList.module.less'

const priorityColors: Record<Priority, string> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
}

const priorityLabels: Record<Priority, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

const statusColors: Record<TodoStatus, string> = {
  pending: 'default',
  in_progress: 'processing',
  completed: 'success',
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
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const message = useMessage()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)

  useEffect(() => {
    fetchCategories()
    fetchTags()
  }, [fetchCategories, fetchTags])

  const handleOpenDialog = (todo?: Todo) => {
    if (todo) {
      setEditingTodo(todo)
      form.setFieldsValue({
        title: todo.title,
        description: todo.description,
        priority: todo.priority,
        dueDate: todo.dueDate ? dayjs(todo.dueDate) : null,
        categoryId: todo.categoryId || undefined,
        tagIds: todo.tags.map((t) => t.id),
      })
    } else {
      setEditingTodo(null)
      form.resetFields()
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingTodo(null)
    form.resetFields()
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        ...values,
        dueDate: values.dueDate?.format('YYYY-MM-DD') || '',
        categoryId: values.categoryId || '',
      }

      if (editingTodo) {
        await updateTodo(editingTodo.id, data as UpdateTodoRequest)
        message.success('更新成功')
      } else {
        await createTodo(data as CreateTodoRequest)
        message.success('创建成功')
      }
      handleCloseDialog()
      actionRef.current?.reload()
    } catch (error) {
      console.error('Failed to save todo:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo(id)
      message.success('删除成功')
      actionRef.current?.reload()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleTodoStatus(id)
      message.success('状态更新成功')
      actionRef.current?.reload()
    } catch (error) {
      message.error('状态更新失败')
    }
  }

  const columns: ProColumns<Todo>[] = [
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      valueType: 'select',
      valueEnum: {
        pending: { text: '待处理', status: 'Default' },
        in_progress: { text: '进行中', status: 'Processing' },
        completed: { text: '已完成', status: 'Success' },
      },
      render: (_, record) => (
        <Tooltip title="点击切换状态">
          <Button
            type="text"
            size="small"
            onClick={() => handleToggleStatus(record.id)}
            icon={
              record.status === 'completed' ? (
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              ) : (
                <MinusCircleOutlined style={{ color: '#d9d9d9' }} />
              )
            }
          />
        </Tooltip>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
      render: (_, record) => (
        <span
          style={{
            textDecoration: record.status === 'completed' ? 'line-through' : 'none',
            color: record.status === 'completed' ? '#999' : 'inherit',
          }}
        >
          {record.title}
        </span>
      ),
    },
    {
      title: '分类',
      dataIndex: 'categoryId',
      width: 120,
      valueType: 'select',
      fieldProps: {
        options: categories.map((cat) => ({ label: cat.name, value: cat.id })),
      },
      render: (_, record) =>
        record.category ? (
          <Tag color={record.category.color}>{record.category.name}</Tag>
        ) : null,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 100,
      valueType: 'select',
      valueEnum: {
        low: { text: '低', status: 'Success' },
        medium: { text: '中', status: 'Warning' },
        high: { text: '高', status: 'Error' },
      },
      render: (_, record) => (
        <Tag color={priorityColors[record.priority]}>
          {priorityLabels[record.priority]}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      search: false,
      render: (_, record) => (
        <Badge
          status={statusColors[record.status] as any}
          text={statusLabels[record.status]}
        />
      ),
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      width: 120,
      valueType: 'date',
      render: (_, record) =>
        record.dueDate ? dayjs(record.dueDate).format('YYYY-MM-DD') : '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0} className={styles.actionBar}>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenDialog(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个待办事项吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card className={styles.container}>
      <ProTable<Todo>
        actionRef={actionRef}
        columns={columns}
        dataSource={todos}
        loading={isLoading}
        rowKey="id"
        scroll={{ x: 900 }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
          optionRender: (_searchConfig, _formProps, dom) => [...dom.reverse()],
        }}
        onSubmit={(params) => {
          setQueryParams({
            keyword: params.title,
            status: params.status,
            priority: params.priority,
            categoryId: params.categoryId,
          })
          fetchTodos({
            keyword: params.title,
            status: params.status,
            priority: params.priority,
            categoryId: params.categoryId,
          })
        }}
        onReset={() => {
          setQueryParams({})
          fetchTodos({})
        }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenDialog()}
          >
            新建待办
          </Button>,
        ]}
        pagination={{
          current: queryParams.page || 1,
          pageSize: queryParams.limit || 10,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => {
            setQueryParams({ page, limit: pageSize })
            fetchTodos({ ...queryParams, page, limit: pageSize })
          },
        }}
        options={{
          density: true,
          fullScreen: true,
          reload: () => fetchTodos(queryParams),
          setting: true,
        }}
        dateFormatter="string"
        headerTitle="待办事项列表"
      />

      <Modal
        title={editingTodo ? '编辑待办' : '新建待办'}
        open={dialogOpen}
        onCancel={handleCloseDialog}
        onOk={handleSubmit}
        destroyOnHidden
        width={520}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入待办标题" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue="medium">
            <Select
              options={[
                { label: '低', value: 'low' },
                { label: '中', value: 'medium' },
                { label: '高', value: 'high' },
              ]}
            />
          </Form.Item>
          <Form.Item name="categoryId" label="分类">
            <Select
              allowClear
              placeholder="请选择分类"
              options={categories.map((cat) => ({
                label: cat.name,
                value: cat.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="dueDate" label="截止日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default TodoList
