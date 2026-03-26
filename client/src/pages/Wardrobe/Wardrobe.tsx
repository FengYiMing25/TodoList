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
  Image,
  Upload,
  message,
  Empty,
  Spin,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShoppingOutlined,
  ExportOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CameraOutlined,
  PictureOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { useWardrobeStore } from '@stores/wardrobeStore'
import { useDictionaryStore } from '@stores/dictionaryStore'
import { useImageUpload, useIsMobile } from '@hooks'
import PageTitle from '@components/PageTitle'
import type {
  WardrobeItem,
  CreateWardrobeRequest,
  UpdateWardrobeRequest,
  DiscardWardrobeRequest,
  WardrobeStatus,
  WardrobeCategory,
} from '@types'
import dayjs from 'dayjs'
import styles from './Wardrobe.module.less'

const Wardrobe: React.FC = () => {
  const {
    items,
    total,
    statistics,
    isLoading,
    filters,
    page,
    fetchItems,
    fetchStatistics,
    createItem,
    updateItem,
    discardItem,
    deleteItem,
    setFilters,
    setPage,
  } = useWardrobeStore()
  const {
    fetchDictionaries,
    getDictionariesByType,
  } = useDictionaryStore()
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const [discardForm] = Form.useForm()
  const isMobile = useIsMobile()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null)
  const [discardingItem, setDiscardingItem] = useState<WardrobeItem | null>(null)
  const editingImageUrlRef = useRef<string | undefined>()
  const [mobileFilter, setMobileFilter] = useState<{
    category?: WardrobeCategory
    status?: WardrobeStatus
  }>({})

  const {
    imageUrl,
    localPreview,
    uploading,
    selectFile,
    setImageUrl,
    uploadPendingFile,
    reset: resetImageUpload,
  } = useImageUpload()

  useEffect(() => {
    fetchItems()
    fetchStatistics()
    fetchDictionaries('wardrobe_category')
  }, [fetchItems, fetchStatistics, fetchDictionaries])

  const wardrobeCategories = getDictionariesByType('wardrobe_category').map(item => ({
    label: item.name,
    value: item.name as WardrobeCategory,
    color: item.color,
  }))

  const handleOpenDialog = (item?: WardrobeItem) => {
    if (item) {
      setEditingItem(item)
      editingImageUrlRef.current = item.imageUrl
    } else {
      setEditingItem(null)
      editingImageUrlRef.current = undefined
      resetImageUpload()
      form.resetFields()
      form.setFieldsValue({
        purchaseDate: dayjs(),
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingItem(null)
    resetImageUpload()
    form.resetFields()
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      let finalImageUrl = imageUrl
      if (localPreview) {
        const uploadedUrl = await uploadPendingFile()
        if (uploadedUrl === null) {
          message.error('图片上传失败，请重试')
          return
        }
        finalImageUrl = uploadedUrl
      }

      const data: CreateWardrobeRequest | UpdateWardrobeRequest = {
        ...values,
        purchaseDate: values.purchaseDate.format('YYYY-MM-DD'),
        imageUrl: finalImageUrl,
      }

      if (editingItem) {
        await updateItem(editingItem.id, data as UpdateWardrobeRequest)
        message.success('更新成功')
      } else {
        await createItem(data as CreateWardrobeRequest)
        message.success('添加成功')
      }

      handleCloseDialog()
      actionRef.current?.reload()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleOpenDiscardDialog = (item: WardrobeItem) => {
    setDiscardingItem(item)
    discardForm.resetFields()
    discardForm.setFieldsValue({
      discardDate: dayjs(),
    })
    setDiscardDialogOpen(true)
  }

  const handleCloseDiscardDialog = () => {
    setDiscardDialogOpen(false)
    setDiscardingItem(null)
    discardForm.resetFields()
  }

  const handleDiscard = async () => {
    if (!discardingItem) return
    try {
      const values = await discardForm.validateFields()
      const data: DiscardWardrobeRequest = {
        discardDate: values.discardDate.format('YYYY-MM-DD'),
        discardReason: values.discardReason,
      }
      await discardItem(discardingItem.id, data)
      message.success('已出库')
      handleCloseDiscardDialog()
      actionRef.current?.reload()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteItem(id)
      message.success('删除成功')
      actionRef.current?.reload()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const formatDailyValue = (item: WardrobeItem) => {
    if (!item.dailyValue) return '-'
    return `¥${item.dailyValue.toFixed(2)}/天`
  }

  const handleMobileFilterChange = (key: 'category' | 'status', value: WardrobeCategory | WardrobeStatus | undefined) => {
    const newFilter = { ...mobileFilter, [key]: value }
    setMobileFilter(newFilter)
    fetchItems(newFilter)
  }

  const columns: ProColumns<WardrobeItem>[] = [
    {
      title: '图片',
      dataIndex: 'imageUrl',
      width: 80,
      search: false,
      render: (_, record) =>
        record.imageUrl ? (
          <Image src={record.imageUrl} width={50} height={50} style={{ objectFit: 'cover', borderRadius: 4 }} />
        ) : (
          <div className={styles.noImage}>无图</div>
        ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 150,
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 100,
      valueType: 'select',
      valueEnum: wardrobeCategories.reduce(
        (acc, cat) => ({ ...acc, [cat.value]: { text: cat.label } }),
        {} as Record<string, { text: string }>
      ),
      render: (_, record) => {
        const cat = wardrobeCategories.find(c => c.value === record.category)
        return <Tag color={cat?.color}>{record.category}</Tag>
      },
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 100,
      search: false,
      render: (_, record) => <span style={{ fontWeight: 'bold' }}>¥{record.price.toFixed(2)}</span>,
    },
    {
      title: '购买日期',
      dataIndex: 'purchaseDate',
      width: 120,
      valueType: 'date',
      render: (_, record) => dayjs(record.purchaseDate).format('YYYY-MM-DD'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        in_use: { text: '使用中', status: 'Success' },
        discarded: { text: '已出库', status: 'Default' },
      },
      render: (_, record) => (
        <Tag color={record.status === 'in_use' ? 'success' : 'default'}>
          {record.status === 'in_use' ? '使用中' : '已出库'}
        </Tag>
      ),
    },
    {
      title: '使用天数',
      dataIndex: 'usageDays',
      width: 100,
      search: false,
      render: (_, record) => <span>{record.usageDays} 天</span>,
    },
    {
      title: '日均价值',
      dataIndex: 'dailyValue',
      width: 120,
      search: false,
      render: (_, record) => (
        <Tooltip title={`总价格 ¥${record.price} ÷ ${record.usageDays} 天`}>
          <span style={{ color: '#1890ff' }}>{formatDailyValue(record)}</span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0} className={styles.actionBar}>
          <Tooltip title="编辑">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleOpenDialog(record)} />
          </Tooltip>
          {record.status === 'in_use' && (
            <Tooltip title="出库">
              <Button type="text" size="small" icon={<ExportOutlined />} onClick={() => handleOpenDiscardDialog(record)} />
            </Tooltip>
          )}
          <Popconfirm title="确定要删除这个物品吗？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Tooltip title="删除">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const renderMobileItem = (item: WardrobeItem) => {
    const cat = wardrobeCategories.find(c => c.value === item.category)
    return (
      <Card key={item.id} className={styles.mobileCard}>
        <div className={styles.mobileCardHeader}>
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className={styles.mobileCardImage} />
          ) : (
            <div className={styles.mobileCardNoImage}>
              <PictureOutlined />
            </div>
          )}
          <div className={styles.mobileCardInfo}>
            <div className={styles.mobileCardTitle}>{item.name}</div>
            <div className={styles.mobileCardPrice}>¥{item.price.toFixed(2)}</div>
          </div>
        </div>
        <div className={styles.mobileCardMeta}>
          <Tag color={cat?.color}>{item.category}</Tag>
          <Tag color={item.status === 'in_use' ? 'success' : 'default'}>
            {item.status === 'in_use' ? '使用中' : '已出库'}
          </Tag>
          <span style={{ fontSize: 12, color: '#999' }}>{item.usageDays}天</span>
        </div>
        <div className={styles.mobileCardFooter}>
          <div className={styles.mobileCardDate}>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {dayjs(item.purchaseDate).format('YYYY-MM-DD')}
          </div>
          <div className={styles.mobileCardActions}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenDialog(item)}
            />
            {item.status === 'in_use' && (
              <Button
                type="text"
                size="small"
                icon={<ExportOutlined />}
                onClick={() => handleOpenDiscardDialog(item)}
              />
            )}
            <Popconfirm
              title="确定要删除吗？"
              onConfirm={() => handleDelete(item.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </div>
        </div>
      </Card>
    )
  }

  const renderMobileView = () => (
    <div className={styles.container}>
      <PageTitle title="电子衣橱" emoji="👗" />
      <Row gutter={[8, 8]} className={styles.summaryRow}>
        <Col span={12}>
          <Card className={styles.summaryCard}>
            <Statistic
              title="物品总数"
              value={statistics?.totalItems || 0}
              prefix={<ShoppingOutlined style={{ fontSize: 12 }} />}
              valueStyle={{ fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card className={styles.summaryCard}>
            <Statistic
              title="使用中"
              value={statistics?.inUseCount || 0}
              valueStyle={{ color: '#52c41a', fontSize: 18 }}
              prefix={<ClockCircleOutlined style={{ fontSize: 12 }} />}
            />
          </Card>
        </Col>
      </Row>

      <div className={styles.mobileHeader}>
        <div className={styles.mobileHeaderTop}>
          <span className={styles.mobileTitle}>电子衣橱</span>
          <span className={styles.mobileCount}>共 {total} 件</span>
        </div>
        <div className={styles.filterRow}>
          <Select
            placeholder="分类"
            allowClear
            value={mobileFilter.category}
            onChange={(v) => handleMobileFilterChange('category', v)}
            options={wardrobeCategories}
          />
          <Select
            placeholder="状态"
            allowClear
            value={mobileFilter.status}
            onChange={(v) => handleMobileFilterChange('status', v)}
            options={[
              { label: '使用中', value: 'in_use' },
              { label: '已出库', value: 'discarded' },
            ]}
          />
        </div>
      </div>

      <Spin spinning={isLoading}>
        {items.length > 0 ? (
          <div className={styles.mobileList}>
            {items.map(renderMobileItem)}
          </div>
        ) : (
          <Empty description="暂无物品" />
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

  const renderDialog = () => (
    <Modal
      title={editingItem ? '编辑物品' : '添加物品'}
      open={dialogOpen}
      onCancel={handleCloseDialog}
      onOk={handleSubmit}
      destroyOnHidden
      width={520}
      afterOpenChange={(open) => {
        if (open && editingItem) {
          setImageUrl(editingImageUrlRef.current)
          form.setFieldsValue({
            name: editingItem.name,
            category: editingItem.category,
            price: editingItem.price,
            purchaseDate: dayjs(editingItem.purchaseDate),
            description: editingItem.description,
          })
        }
      }}
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item label="物品图片">
          <Space>
            {(imageUrl || localPreview) ? (
              <Image
                src={localPreview || imageUrl}
                width={80}
                height={80}
                className={styles.imagePreview}
                preview={{ mask: '预览' }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
              />
            ) : (
              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  selectFile(file)
                  return false
                }}
              >
                <div className={styles.uploadPlaceholder}>
                  <CameraOutlined style={{ fontSize: 24, color: '#999' }} />
                  <span>选择图片</span>
                </div>
              </Upload>
            )}
            {(imageUrl || localPreview) && (
              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  selectFile(file)
                  return false
                }}
              >
                <Button loading={uploading}>{uploading ? '上传中...' : '更换图片'}</Button>
              </Upload>
            )}
          </Space>
        </Form.Item>
        <Form.Item name="name" label="物品名称" rules={[{ required: true, message: '请输入物品名称' }]}>
          <Input placeholder="请输入物品名称" />
        </Form.Item>
        <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
          <Select placeholder="请选择分类" options={wardrobeCategories} />
        </Form.Item>
        <Form.Item name="price" label="价格" rules={[{ required: true, message: '请输入价格' }]}>
          <InputNumber style={{ width: '100%' }} min={0} precision={2} prefix="¥" placeholder="请输入价格" />
        </Form.Item>
        <Form.Item name="purchaseDate" label="购买日期" rules={[{ required: true, message: '请选择购买日期' }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="description" label="备注">
          <Input.TextArea rows={2} placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </Modal>
  )

  const renderDiscardDialog = () => (
    <Modal title="物品出库" open={discardDialogOpen} onCancel={handleCloseDiscardDialog} onOk={handleDiscard} destroyOnHidden width={420}>
      <Form form={discardForm} layout="vertical" preserve={false}>
        <Form.Item name="discardDate" label="出库日期" rules={[{ required: true, message: '请选择出库日期' }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="discardReason" label="出库原因">
          <Input.TextArea rows={2} placeholder="如：坏了、不要了、送人了等" />
        </Form.Item>
        {discardingItem && (
          <Card size="small" className={styles.discardInfoCard}>
            <p>
              <strong>物品：</strong>
              {discardingItem.name}
            </p>
            <p>
              <strong>购买价格：</strong>¥{discardingItem.price.toFixed(2)}
            </p>
            <p>
              <strong>已使用：</strong>
              {discardingItem.usageDays} 天
            </p>
            <p>
              <strong>日均价值：</strong>
              {formatDailyValue(discardingItem)}
            </p>
          </Card>
        )}
      </Form>
    </Modal>
  )

  if (isMobile) {
    return (
      <>
        {renderMobileView()}
        {renderDialog()}
        {renderDiscardDialog()}
      </>
    )
  }

  return (
    <div className={styles.container}>
      <PageTitle title="电子衣橱" emoji="👗" />
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={6}>
          <Card className={styles.summaryCard}>
            <Statistic title="物品总数" value={statistics?.totalItems || 0} prefix={<ShoppingOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className={styles.summaryCard}>
            <Statistic
              title="使用中"
              value={statistics?.inUseCount || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className={styles.summaryCard}>
            <Statistic
              title="总价值"
              value={statistics?.totalValue || 0}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className={styles.summaryCard}>
            <Statistic
              title="平均使用天数"
              value={statistics?.avgUsageDays || 0}
              suffix="天"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <ProTable<WardrobeItem>
          actionRef={actionRef}
          columns={columns}
          dataSource={items}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 1100 }}
          search={{
            labelWidth: 'auto',
            defaultCollapsed: false,
          }}
          onSubmit={(params) => {
            setFilters({ category: params.category, status: params.status })
            fetchItems({ category: params.category, status: params.status })
          }}
          onReset={() => {
            setFilters({})
            fetchItems({})
          }}
          toolBarRender={() => [
            <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => handleOpenDialog()}>
              添加物品
            </Button>,
          ]}
          pagination={{
            current: page,
            pageSize: filters.limit || 10,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPage(page)
              fetchItems({ ...filters, page, limit: pageSize })
            },
          }}
          options={{
            density: true,
            fullScreen: true,
            reload: () => fetchItems(filters),
            setting: true,
          }}
          dateFormatter="string"
          headerTitle="电子衣橱"
        />
      </Card>

      {renderDialog()}
      {renderDiscardDialog()}
    </div>
  )
}

export default Wardrobe
