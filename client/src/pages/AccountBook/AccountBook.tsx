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
  Empty,
  Spin,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { useAccountStore } from '@stores/accountStore'
import { useDictionaryStore } from '@stores/dictionaryStore'
import { useMessage, useIsMobile } from '@hooks'
import type { Account, CreateAccountRequest, UpdateAccountRequest, AccountType } from '@types'
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
  const {
    fetchDictionaries,
    getDictionariesByType,
  } = useDictionaryStore()
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const message = useMessage()
  const isMobile = useIsMobile()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [mobileFilter, setMobileFilter] = useState<{ type?: AccountType }>({})

  useEffect(() => {
    fetchAccounts()
    fetchDictionaries('account_income_category')
    fetchDictionaries('account_expense_category')
  }, [fetchAccounts, fetchDictionaries])

  const getCategories = (type: AccountType) => {
    const dictType = type === 'income' ? 'account_income_category' : 'account_expense_category'
    const items = getDictionariesByType(dictType)
    return items.map((item) => ({ label: item.name, value: item.name }))
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

  const handleMobileFilterChange = (type: AccountType | undefined) => {
    setMobileFilter({ type })
    fetchAccounts({ type })
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
      render: (_, record) => {
        const dictType = record.type === 'income' ? 'account_income_category' : 'account_expense_category'
        const dict = getDictionariesByType(dictType).find(d => d.name === record.category)
        return <Tag color={dict?.color}>{record.category}</Tag>
      },
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

  const renderMobileItem = (account: Account) => {
    const dictType = account.type === 'income' ? 'account_income_category' : 'account_expense_category'
    const dict = getDictionariesByType(dictType).find(d => d.name === account.category)
    return (
    <Card key={account.id} className={styles.mobileCard}>
      <div className={styles.mobileCardHeader}>
        <div
          className={styles.mobileCardAmount}
          style={{
            color: account.type === 'income' ? '#52c41a' : '#ff4d4f',
          }}
        >
          {formatAmount(account.amount, account.type)}
        </div>
        <Tag color={account.type === 'income' ? 'success' : 'error'}>
          {account.type === 'income' ? '收入' : '支出'}
        </Tag>
      </div>
      <div className={styles.mobileCardMeta}>
        <Tag color={dict?.color}>{account.category}</Tag>
        <div className={styles.mobileCardDate}>
          <CalendarOutlined style={{ marginRight: 4 }} />
          {dayjs(account.date).format('YYYY-MM-DD')}
        </div>
      </div>
      {account.description && (
        <div className={styles.mobileCardDesc}>{account.description}</div>
      )}
      <div className={styles.mobileCardFooter}>
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleOpenDialog(account)}
        />
        <Popconfirm
          title="确定要删除吗？"
          onConfirm={() => handleDelete(account.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </div>
    </Card>
  )
  }

  const renderMobileView = () => (
    <div className={styles.container}>
      <Row gutter={[8, 8]} className={styles.summaryRow}>
        <Col span={8}>
          <Card className={styles.summaryCard}>
            <Statistic
              title="收入"
              value={summary.income}
              precision={0}
              valueStyle={{ color: '#52c41a', fontSize: 16 }}
              prefix={<ArrowUpOutlined style={{ fontSize: 12 }} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className={styles.summaryCard}>
            <Statistic
              title="支出"
              value={summary.expense}
              precision={0}
              valueStyle={{ color: '#ff4d4f', fontSize: 16 }}
              prefix={<ArrowDownOutlined style={{ fontSize: 12 }} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className={styles.summaryCard}>
            <Statistic
              title="结余"
              value={summary.balance}
              precision={0}
              valueStyle={{ color: summary.balance >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 16 }}
              prefix={<WalletOutlined style={{ fontSize: 12 }} />}
            />
          </Card>
        </Col>
      </Row>

      <div className={styles.mobileHeader}>
        <div className={styles.mobileHeaderTop}>
          <span className={styles.mobileTitle}>记账记录</span>
          <span className={styles.mobileCount}>共 {total} 条</span>
        </div>
        <div className={styles.filterRow}>
          <Select
            placeholder="筛选类型"
            allowClear
            value={mobileFilter.type}
            onChange={handleMobileFilterChange}
            options={[
              { label: '收入', value: 'income' },
              { label: '支出', value: 'expense' },
            ]}
          />
        </div>
      </div>

      <Spin spinning={isLoading}>
        {accounts.length > 0 ? (
          <div className={styles.mobileList}>
            {accounts.map(renderMobileItem)}
          </div>
        ) : (
          <Empty description="暂无记录" />
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
          title={editingAccount ? '编辑记录' : '新建记录'}
          open={dialogOpen}
          onCancel={handleCloseDialog}
          onOk={handleSubmit}
          destroyOnClose
          width={520}
          afterOpenChange={(open) => {
            if (open && editingAccount) {
              form.setFieldsValue({
                type: editingAccount.type,
                category: editingAccount.category,
                amount: editingAccount.amount,
                description: editingAccount.description,
                date: dayjs(editingAccount.date),
              })
            }
          }}
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
                    options={getCategories(getFieldValue('type'))}
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
      </>
    )
  }

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
        destroyOnClose
        width={520}
        afterOpenChange={(open) => {
          if (open && editingAccount) {
            form.setFieldsValue({
              type: editingAccount.type,
              category: editingAccount.category,
              amount: editingAccount.amount,
              description: editingAccount.description,
              date: dayjs(editingAccount.date),
            })
          }
        }}
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
                  options={getCategories(getFieldValue('type'))}
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
