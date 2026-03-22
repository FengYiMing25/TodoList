import { useEffect, useState, useRef } from 'react'
import {
  Card,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Space,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { useAccountStore } from '@stores/accountStore'
import { useMessage } from '@hooks/useMessage'
import type { Account, CreateAccountRequest, UpdateAccountRequest, AccountType } from '@types'
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@types'
import dayjs from 'dayjs'
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
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const message = useMessage()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const getCategories = (type: AccountType) => {
    return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  }

  const handleOpenDialog = (account?: Account) => {
    if (account) {
      setEditingAccount(account)
      form.setFieldsValue({
        type: account.type,
        category: account.category,
        amount: account.amount,
        description: account.description,
        date: dayjs(account.date),
      })
    } else {
      setEditingAccount(null)
      form.resetFields()
      form.setFieldsValue({
        type: 'expense',
        date: dayjs(),
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingAccount(null)
    form.resetFields()
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
      }

      if (editingAccount) {
        await updateAccount(editingAccount.id, data as UpdateAccountRequest)
        message.success('更新成功')
      } else {
        await createAccount(data as CreateAccountRequest)
        message.success('创建成功')
      }
      handleCloseDialog()
      actionRef.current?.reload()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAccount(id)
      message.success('删除成功')
      actionRef.current?.reload()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const formatAmount = (amount: number, type: AccountType) => {
    return type === 'income' ? `+${amount.toFixed(2)}` : `-${amount.toFixed(2)}`
  }

  const columns: ProColumns<Account>[] = [
    {
      title: '日期',
      dataIndex: 'date',
      width: 120,
      valueType: 'date',
      render: (_, record) => dayjs(record.date).format('YYYY-MM-DD'),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      valueType: 'select',
      valueEnum: {
        income: { text: '收入', status: 'Success' },
        expense: { text: '支出', status: 'Error' },
      },
      render: (_, record) => (
        <Tag color={record.type === 'income' ? 'success' : 'error'}>
          {record.type === 'income' ? '收入' : '支出'}
        </Tag>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 120,
      render: (_, record) => <Tag>{record.category}</Tag>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 150,
      search: false,
      render: (_, record) => (
        <span
          style={{
            color: record.type === 'income' ? '#52c41a' : '#ff4d4f',
            fontWeight: 'bold',
          }}
        >
          {formatAmount(record.amount, record.type)}
        </span>
      ),
    },
    {
      title: '备注',
      dataIndex: 'description',
      ellipsis: true,
      search: false,
      render: (_, record) => record.description || '-',
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
            title="确定要删除这条记录吗？"
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
    <div className={styles.container}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card className={styles.summaryCard}>
            <Statistic
              title="收入"
              value={summary.income}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ArrowUpOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className={styles.summaryCard}>
            <Statistic
              title="支出"
              value={summary.expense}
              precision={2}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ArrowDownOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className={styles.summaryCard}>
            <Statistic
              title="结余"
              value={summary.balance}
              precision={2}
              valueStyle={{ color: summary.balance >= 0 ? '#52c41a' : '#ff4d4f' }}
              prefix={<WalletOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <ProTable<Account>
          actionRef={actionRef}
          columns={columns}
          dataSource={accounts}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 800 }}
          search={{
            labelWidth: 'auto',
            defaultCollapsed: false,
          }}
          onSubmit={(params) => {
            setQueryParams({
              type: params.type,
              startDate: params.date?.[0]?.format('YYYY-MM-DD'),
              endDate: params.date?.[1]?.format('YYYY-MM-DD'),
            })
            fetchAccounts({
              type: params.type,
              startDate: params.date?.[0]?.format('YYYY-MM-DD'),
              endDate: params.date?.[1]?.format('YYYY-MM-DD'),
            })
          }}
          onReset={() => {
            setQueryParams({})
            fetchAccounts({})
          }}
          toolBarRender={() => [
            <Button
              key="add"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenDialog()}
            >
              新建记录
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
              fetchAccounts({ ...queryParams, page, limit: pageSize })
            },
          }}
          options={{
            density: true,
            fullScreen: true,
            reload: () => fetchAccounts(queryParams),
            setting: true,
          }}
          dateFormatter="string"
          headerTitle="记账记录"
        />
      </Card>

      <Modal
        title={editingAccount ? '编辑记录' : '新建记录'}
        open={dialogOpen}
        onCancel={handleCloseDialog}
        onOk={handleSubmit}
        destroyOnHidden
        width={520}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="type" label="类型" initialValue="expense">
            <Select
              onChange={() => form.setFieldsValue({ category: undefined })}
              options={[
                { label: '收入', value: 'income' },
                { label: '支出', value: 'expense' },
              ]}
            />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => (
              <Form.Item
                name="category"
                label="分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select
                  placeholder="请选择分类"
                  options={getCategories(getFieldValue('type')).map((cat) => ({
                    label: cat,
                    value: cat,
                  }))}
                />
              </Form.Item>
            )}
          </Form.Item>
          <Form.Item
            name="amount"
            label="金额"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              placeholder="请输入金额"
            />
          </Form.Item>
          <Form.Item name="date" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AccountBook
