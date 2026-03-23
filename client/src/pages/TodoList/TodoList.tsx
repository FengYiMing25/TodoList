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
  Input as AntInput,
  Empty,
  Spin,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined,
  SearchOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { useTodoStore } from '@stores/todoStore'
import { useDictionaryStore } from '@stores/dictionaryStore'
import { useMessage, useIsMobile } from '@hooks'
import PageTitle from '@components/PageTitle'
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
  const { fetchDictionaries, getDictionariesByType } = useDictionaryStore()
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const message = useMessage()
  const isMobile = useIsMobile()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [mobileSearch, setMobileSearch] = useState('')
  const [mobileFilter, setMobileFilter] = useState<{
    status?: TodoStatus
    priority?: Priority
    categoryId?: string
  }>({})

  const categories = getDictionariesByType('todo_category')
  const tags = getDictionariesByType('todo_tag')

  useEffect(() => {
    fetchDictionaries('todo_category')
    fetchDictionaries('todo_tag')
    fetchTodos()
  }, [fetchDictionaries, fetchTodos])

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

  const handleMobileSearch = () => {
    fetchTodos({
      keyword: mobileSearch,
      ...mobileFilter,
    })
  }

  const handleMobileFilterChange = (key: string, value: string | undefined) => {
    const newFilter = { ...mobileFilter, [key]: value }
    setMobileFilter(newFilter)
    fetchTodos({
      keyword: mobileSearch,
      ...newFilter,
    })
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

  const renderMobileItem = (todo: Todo) => (
    <Card key={todo.id} className={styles.mobileCard}>
      <div className={styles.mobileCardHeader}>
        <div
          className={styles.mobileCardTitle}
          style={{
            textDecoration: todo.status === 'completed' ? 'line-through' : 'none',
            color: todo.status === 'completed' ? '#999' : 'inherit',
          }}
        >
          {todo.title}
        </div>
        <Button
          type="text"
          size="small"
          onClick={() => handleToggleStatus(todo.id)}
          icon={
            todo.status === 'completed' ? (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            ) : (
              <MinusCircleOutlined style={{ color: '#d9d9d9' }} />
            )
          }
        />
      </div>
      <div className={styles.mobileCardMeta}>
        {todo.category && (
          <Tag color={todo.category.color}>{todo.category.name}</Tag>
        )}
        <Tag color={priorityColors[todo.priority]}>
          {priorityLabels[todo.priority]}
        </Tag>
        <Badge
          status={statusColors[todo.status] as any}
          text={statusLabels[todo.status]}
        />
      </div>
      {todo.description && (
        <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
          {todo.description}
        </div>
      )}
      <div className={styles.mobileCardFooter}>
        <div className={styles.mobileCardDate}>
          <CalendarOutlined style={{ marginRight: 4 }} />
          {todo.dueDate ? dayjs(todo.dueDate).format('YYYY-MM-DD') : '无截止日期'}
        </div>
        <div className={styles.mobileCardActions}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenDialog(todo)}
          />
          <Popconfirm
            title="确定要删除吗？"
            onConfirm={() => handleDelete(todo.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      </div>
    </Card>
  )

  const renderMobileView = () => (
    <div className={styles.container}>
      <PageTitle title="待办事项" emoji="✅" />
      <div className={styles.mobileHeader}>
        <div className={styles.mobileHeaderTop}>
          <span className={styles.mobileTitle}>待办事项</span>
          <span className={styles.mobileCount}>共 {total} 条</span>
        </div>
        <div className={styles.searchBar}>
          <AntInput.Search
            placeholder="搜索待办"
            value={mobileSearch}
            onChange={(e) => setMobileSearch(e.target.value)}
            onSearch={handleMobileSearch}
            enterButton={<SearchOutlined />}
          />
        </div>
        <div className={styles.filterRow}>
          <Select
            placeholder="状态"
            allowClear
            value={mobileFilter.status}
            onChange={(v) => handleMobileFilterChange('status', v)}
            options={[
              { label: '待处理', value: 'pending' },
              { label: '进行中', value: 'in_progress' },
              { label: '已完成', value: 'completed' },
            ]}
          />
          <Select
            placeholder="优先级"
            allowClear
            value={mobileFilter.priority}
            onChange={(v) => handleMobileFilterChange('priority', v)}
            options={[
              { label: '低', value: 'low' },
              { label: '中', value: 'medium' },
              { label: '高', value: 'high' },
            ]}
          />
          <Select
            placeholder="分类"
            allowClear
            value={mobileFilter.categoryId}
            onChange={(v) => handleMobileFilterChange('categoryId', v)}
            options={categories.map((cat) => ({ label: cat.name, value: cat.id }))}
          />
        </div>
      </div>

      <Spin spinning={isLoading}>
        {todos.length > 0 ? (
          <div className={styles.mobileList}>
            {todos.map(renderMobileItem)}
          </div>
        ) : (
          <Empty description="暂无待办事项" />
        )}
      </Spin>

      <div style={{ position: 'fixed', right: 16, bottom: 80, zIndex: 100 }}>
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => handleOpenDialog()}
        />
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        {renderMobileView()}
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
            <Form.Item name="tagIds" label="标签">
              <Select
                mode="multiple"
                allowClear
                placeholder="请选择标签"
                options={tags.map((tag) => ({
                  label: tag.name,
                  value: tag.id,
                }))}
              />
            </Form.Item>
            <Form.Item name="dueDate" label="截止日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>
      </>
    )
  }

  return (
    <Card className={styles.container}>
      <PageTitle title="待办事项" emoji="✅" />
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
        afterOpenChange={(open) => {
          if (open && editingTodo) {
            form.setFieldsValue({
              title: editingTodo.title,
              description: editingTodo.description,
              priority: editingTodo.priority,
              dueDate: editingTodo.dueDate ? dayjs(editingTodo.dueDate) : null,
              categoryId: editingTodo.categoryId || undefined,
              tagIds: editingTodo.tags.map((t) => t.id),
            })
          }
        }}
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
          <Form.Item name="tagIds" label="标签">
            <Select
              mode="multiple"
              allowClear
              placeholder="请选择标签"
              options={tags.map((tag) => ({
                label: tag.name,
                value: tag.id,
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
