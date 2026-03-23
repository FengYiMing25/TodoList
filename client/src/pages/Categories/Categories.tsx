import { useEffect, useState } from 'react'
import {
  Card,
  Button,
  Row,
  Col,
  Modal,
  Form,
  Input,
  Popconfirm,
  Empty,
  Spin,
  Tooltip,
  Badge,
  Menu,
  Typography,
  Divider,
  Dropdown,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagOutlined,
  SearchOutlined,
  MoreOutlined,
  AppstoreAddOutlined,
  SyncOutlined,
  InboxOutlined,
  RocketOutlined,
} from '@ant-design/icons'
import { useDictionaryStore } from '@stores/dictionaryStore'
import { useIsMobile } from '@hooks'
import { useMessage } from '@hooks/useMessage'
import PageTitle from '@components/PageTitle'
import { dictionaryApi } from '@services/dictionary'
import type {
  Dictionary,
  CreateDictionaryRequest,
  UpdateDictionaryRequest,
  DictionaryType,
  DictionaryTypeConfig,
  CreateDictionaryTypeRequest,
  UpdateDictionaryTypeRequest,
} from '@types'
import styles from './Categories.module.less'

const predefinedColors = [
  '#1890ff',
  '#52c41a',
  '#faad14',
  '#ff4d4f',
  '#722ed1',
  '#13c2c2',
  '#eb2f96',
  '#fa8c16',
  '#a0d911',
  '#2f54eb',
]

const Categories: React.FC = () => {
  const {
    isLoading,
    dictionaryTypes,
    fetchDictionaries,
    createDictionary,
    updateDictionary,
    deleteDictionary,
    getDictionariesByType,
    fetchDictionaryTypes,
    createDictionaryType,
    updateDictionaryType,
    deleteDictionaryType,
  } = useDictionaryStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [typeDialogOpen, setTypeDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Dictionary | null>(null)
  const [editingType, setEditingType] = useState<DictionaryTypeConfig | null>(null)
  const [currentType, setCurrentType] = useState<DictionaryType>('')
  const [searchText, setSearchText] = useState('')
  const [form] = Form.useForm()
  const [typeForm] = Form.useForm()
  const message = useMessage()
  const isMobile = useIsMobile()

  useEffect(() => {
    fetchDictionaries()
    fetchDictionaryTypes()
  }, [fetchDictionaries, fetchDictionaryTypes])

  useEffect(() => {
    if (dictionaryTypes.length > 0 && !currentType) {
      setCurrentType(dictionaryTypes[0].key)
    }
  }, [dictionaryTypes, currentType])

  const handleOpenDialog = (type: DictionaryType, item?: Dictionary) => {
    setCurrentType(type)
    if (item) {
      setEditingItem(item)
      form.setFieldsValue({
        name: item.name,
        color: item.color,
        icon: item.icon || '',
      })
    } else {
      setEditingItem(null)
      form.resetFields()
      form.setFieldsValue({ color: predefinedColors[0] })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingItem(null)
    form.resetFields()
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingItem) {
        await updateDictionary(editingItem.id, values as UpdateDictionaryRequest)
        message.success('更新成功')
      } else {
        await createDictionary({
          ...values,
          type: currentType,
        } as CreateDictionaryRequest)
        message.success('创建成功')
      }
      handleCloseDialog()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDictionary(id)
      message.success('删除成功')
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleOpenTypeDialog = (type?: DictionaryTypeConfig) => {
    if (type) {
      setEditingType(type)
      typeForm.setFieldsValue({
        key: type.key,
        label: type.label,
        description: type.description || '',
      })
    } else {
      setEditingType(null)
      typeForm.resetFields()
    }
    setTypeDialogOpen(true)
  }

  const handleCloseTypeDialog = () => {
    setTypeDialogOpen(false)
    setEditingType(null)
    typeForm.resetFields()
  }

  const handleSubmitType = async () => {
    try {
      const values = await typeForm.validateFields()
      if (editingType) {
        await updateDictionaryType(editingType.key, {
          label: values.label,
          description: values.description,
        } as UpdateDictionaryTypeRequest)
        message.success('更新成功')
      } else {
        await createDictionaryType(values as CreateDictionaryTypeRequest)
        message.success('创建成功')
        setCurrentType(values.key)
      }
      handleCloseTypeDialog()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleDeleteType = async (key: string) => {
    try {
      await deleteDictionaryType(key)
      message.success('删除成功')
      if (currentType === key && dictionaryTypes.length > 0) {
        setCurrentType(dictionaryTypes[0].key)
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      message.error(err.response?.data?.message || '删除失败')
    }
  }

  const handleInitDefault = async (type?: DictionaryType) => {
    try {
      const result = await dictionaryApi.initDefaultDictionaries(type)
      message.success(`成功初始化 ${result.addedCount} 个默认分类`)
      fetchDictionaries()
      fetchDictionaryTypes()
    } catch (error) {
      message.error('初始化失败')
    }
  }

  const getFilteredItems = (type: DictionaryType) => {
    const items = getDictionariesByType(type)
    if (!searchText) return items
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchText.toLowerCase())
    )
  }

  const renderTypeContent = (type: DictionaryType) => {
    const items = getFilteredItems(type)
    const config = dictionaryTypes.find((c) => c.key === type)

    if (isMobile) {
      return (
        <div className={styles.mobileContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>{config?.description || config?.label}</span>
            <div className={styles.headerActions}>
              <Button
                size="small"
                icon={<SyncOutlined />}
                onClick={() => handleInitDefault(type)}
              >
                初始化
              </Button>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => handleOpenDialog(type)}
              >
                新建
              </Button>
            </div>
          </div>
          {items.length === 0 ? (
            <Empty description="暂无数据" />
          ) : (
            <div className={styles.mobileList}>
              {items.map((item) => (
                <div key={item.id} className={styles.mobileItem}>
                  <div className={styles.mobileItemContent}>
                    <div
                      className={styles.colorDot}
                      style={{ backgroundColor: item.color }}
                    />
                    <span className={styles.itemName}>{item.name}</span>
                  </div>
                  <div className={styles.mobileItemActions}>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleOpenDialog(type, item)}
                    />
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
              ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <div>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>{config?.description || config?.label}</span>
          <div className={styles.headerActions}>
            <Button
              icon={<SyncOutlined />}
              onClick={() => handleInitDefault(type)}
            >
              初始化
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenDialog(type)}
            >
              新建{config?.label}
            </Button>
          </div>
        </div>
        {items.length === 0 ? (
          <Empty description={`暂无${config?.label}`} style={{ marginTop: 24 }} />
        ) : (
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {items.map((item) => (
              <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  className={styles.itemCard}
                  actions={[
                    <Button
                      key="edit"
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleOpenDialog(type, item)}
                    />,
                    <Popconfirm
                      key="delete"
                      title="确定要删除吗？"
                      onConfirm={() => handleDelete(item.id)}
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
                      style={{ backgroundColor: item.color }}
                    />
                    <span className={styles.itemName}>{item.name}</span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    )
  }

  const menuItems = dictionaryTypes.map((config) => {
    const count = getDictionariesByType(config.key).length
    return {
      key: config.key,
      icon: <TagOutlined />,
      label: (
        <div className={styles.menuItemLabel}>
          <span>{config.label}</span>
          <Badge count={count} size="small" />
        </div>
      ),
    }
  })

  const renderDictionaryForm = () => (
    <Form form={form} layout="vertical" preserve={false}>
      <Form.Item
        name="name"
        label="名称"
        rules={[{ required: true, message: '请输入名称' }]}
      >
        <Input placeholder="请输入名称" />
      </Form.Item>
      <Form.Item name="color" label="颜色" initialValue={predefinedColors[0]}>
        <div className={styles.colorPicker}>
          {predefinedColors.map((color) => (
            <div
              key={color}
              className={`${styles.colorOption} ${form.getFieldValue('color') === color ? styles.colorSelected : ''
                }`}
              style={{ backgroundColor: color }}
              onClick={() => form.setFieldsValue({ color })}
            />
          ))}
        </div>
      </Form.Item>
    </Form>
  )

  const renderTypeForm = () => (
    <Form form={typeForm} layout="vertical" preserve={false}>
      <Form.Item
        name="key"
        label="类型标识"
        rules={[
          { required: true, message: '请输入类型标识' },
          { pattern: /^[a-z_]+$/, message: '只能使用小写字母和下划线' },
        ]}
      >
        <Input placeholder="如：my_category" disabled={!!editingType} />
      </Form.Item>
      <Form.Item
        name="label"
        label="类型名称"
        rules={[{ required: true, message: '请输入类型名称' }]}
      >
        <Input placeholder="如：我的分类" />
      </Form.Item>
      <Form.Item name="description" label="描述">
        <Input placeholder="类型描述（可选）" />
      </Form.Item>
    </Form>
  )

  const renderEmptyState = () => (
    <div className={styles.emptyState}>
      <InboxOutlined className={styles.emptyIcon} />
      <Typography.Title level={4}>暂无分类数据</Typography.Title>
      <Typography.Text type="secondary">
        您可以初始化系统预设的分类，或自定义创建新的分类类型
      </Typography.Text>
      <div className={styles.emptyActions}>
        <Button
          type="primary"
          size="large"
          icon={<RocketOutlined />}
          onClick={() => handleInitDefault()}
        >
          初始化默认分类
        </Button>
        <Button
          size="large"
          icon={<AppstoreAddOutlined />}
          onClick={() => handleOpenTypeDialog()}
        >
          自定义分类
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <div className={styles.container}>
        <PageTitle title="分类管理" emoji="🏷️" />
        <Spin spinning={isLoading}>
          {dictionaryTypes.length === 0 ? (
            <Card className={styles.mobileCard}>
              {renderEmptyState()}
            </Card>
          ) : (
            <Card className={styles.mobileCard}>
              <div className={styles.mobileHeader}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Input
                    placeholder="搜索字典项"
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                    className={styles.searchInput}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <Button
                    type="primary"
                    icon={<AppstoreAddOutlined />}
                    onClick={() => handleOpenTypeDialog()}
                  >
                    新类型
                  </Button>
                </div>
                <div className={styles.mobileTypeSelector}>
                  {dictionaryTypes.map((config) => (
                    <Button
                      key={config.key}
                      type={currentType === config.key ? 'primary' : 'default'}
                      size="small"
                      onClick={() => setCurrentType(config.key)}
                    >
                      {config.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              {currentType && renderTypeContent(currentType)}
            </Card>
          )}
        </Spin>

        <Modal
          title={editingItem ? '编辑字典项' : '新建字典项'}
          open={dialogOpen}
          onCancel={handleCloseDialog}
          onOk={handleSubmit}
          destroyOnHidden
          afterOpenChange={(open) => {
            if (open && editingItem) {
              form.setFieldsValue({
                name: editingItem.name,
                color: editingItem.color,
                icon: editingItem.icon || '',
              })
            }
          }}
        >
          {renderDictionaryForm()}
        </Modal>

        <Modal
          title={editingType ? '编辑字典类型' : '新建字典类型'}
          open={typeDialogOpen}
          onCancel={handleCloseTypeDialog}
          onOk={handleSubmitType}
          destroyOnHidden
          afterOpenChange={(open) => {
            if (open && editingType) {
              typeForm.setFieldsValue({
                key: editingType.key,
                label: editingType.label,
                description: editingType.description || '',
              })
            }
          }}
        >
          {renderTypeForm()}
        </Modal>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <PageTitle title="分类管理" emoji="🏷️" />
      <Spin spinning={isLoading}>
        {dictionaryTypes.length === 0 ? (
          <Card className={styles.emptyCard}>
            {renderEmptyState()}
          </Card>
        ) : (
          <div className={styles.layoutWrapper}>
            <Card className={styles.sideMenu}>
              <div className={styles.sideMenuHeader}>
                <Typography.Title level={5} style={{ margin: 0 }}>
                  字典分类
                </Typography.Title>
                <Tooltip title="添加新类型">
                  <Button
                    type="text"
                    size="small"
                    icon={<AppstoreAddOutlined />}
                    onClick={() => handleOpenTypeDialog()}
                  />
                </Tooltip>
              </div>
              <Menu
                mode="inline"
                selectedKeys={[currentType]}
                items={menuItems}
                onClick={({ key }) => setCurrentType(key)}
                className={styles.sideMenuList}
              />
            </Card>

            <Card className={styles.mainContent}>
              <div className={styles.contentHeader}>
                <Input
                  placeholder="搜索字典项"
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  style={{ width: 200 }}
                />
                {currentType && (
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'edit',
                          icon: <EditOutlined />,
                          label: '编辑类型',
                          onClick: () => {
                            const type = dictionaryTypes.find((t) => t.key === currentType)
                            if (type) handleOpenTypeDialog(type)
                          },
                        },
                        {
                          key: 'delete',
                          icon: <DeleteOutlined />,
                          label: '删除类型',
                          danger: true,
                          onClick: () => {
                            Modal.confirm({
                              title: '确认删除',
                              content: '确定要删除该字典类型吗？删除后无法恢复。',
                              onOk: () => handleDeleteType(currentType),
                            })
                          },
                        },
                      ],
                    }}
                  >
                    <Button icon={<MoreOutlined />} style={{ marginLeft: 8 }} />
                  </Dropdown>
                )}
              </div>
              <Divider style={{ margin: '12px 0' }} />
              {currentType && renderTypeContent(currentType)}
            </Card>
          </div>
        )}
      </Spin>

      <Modal
        title={editingItem ? '编辑字典项' : '新建字典项'}
        open={dialogOpen}
        onCancel={handleCloseDialog}
        onOk={handleSubmit}
        destroyOnHidden
        afterOpenChange={(open) => {
          if (open && editingItem) {
            form.setFieldsValue({
              name: editingItem.name,
              color: editingItem.color,
              icon: editingItem.icon || '',
            })
          }
        }}
      >
        {renderDictionaryForm()}
      </Modal>

      <Modal
        title={editingType ? '编辑字典类型' : '新建字典类型'}
        open={typeDialogOpen}
        onCancel={handleCloseTypeDialog}
        onOk={handleSubmitType}
        destroyOnHidden
        afterOpenChange={(open) => {
          if (open && editingType) {
            typeForm.setFieldsValue({
              key: editingType.key,
              label: editingType.label,
              description: editingType.description || '',
            })
          }
        }}
      >
        {renderTypeForm()}
      </Modal>
    </div>
  )
}

export default Categories
