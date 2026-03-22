import { ReactNode, useState } from 'react'
import { Card, Button, Input, Select, Empty, Spin, Space, Popconfirm, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { useIsMobile } from '@hooks'
import styles from './MobileTable.module.less'

export interface MobileFilterOption {
  label: string
  value: string
}

export interface MobileFilter {
  key: string
  placeholder: string
  options?: MobileFilterOption[]
  value?: string
  onChange?: (value: string | undefined) => void
}

export interface MobileTableProps<T> {
  data: T[]
  loading?: boolean
  total?: number
  title: string
  searchPlaceholder?: string
  searchValue?: string
  onSearch?: (value: string) => void
  filters?: MobileFilter[]
  renderItem: (item: T) => ReactNode
  onAdd?: () => void
  addText?: string
  showAddButton?: boolean
}

function MobileTableInner<T extends { id: string }>({
  data,
  loading = false,
  total = 0,
  title,
  searchPlaceholder = '搜索',
  searchValue = '',
  onSearch,
  filters = [],
  renderItem,
  onAdd,
  addText: _addText = '添加',
  showAddButton = true,
}: MobileTableProps<T>) {
  const [localSearch, setLocalSearch] = useState(searchValue)

  const handleSearch = (value: string) => {
    setLocalSearch(value)
    onSearch?.(value)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <span className={styles.title}>{title}</span>
          <span className={styles.count}>共 {total} 条</span>
        </div>
        {onSearch && (
          <div className={styles.searchBar}>
            <Input.Search
              placeholder={searchPlaceholder}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
            />
          </div>
        )}
        {filters.length > 0 && (
          <div className={styles.filterRow}>
            {filters.map((filter) => (
              <Select
                key={filter.key}
                placeholder={filter.placeholder}
                allowClear
                value={filter.value}
                onChange={filter.onChange}
                options={filter.options}
              />
            ))}
          </div>
        )}
      </div>

      <Spin spinning={loading}>
        {data.length > 0 ? (
          <div className={styles.list}>{data.map(renderItem)}</div>
        ) : (
          <Empty description="暂无数据" />
        )}
      </Spin>

      {showAddButton && onAdd && (
        <div className={styles.fab}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<PlusOutlined />}
            onClick={onAdd}
          />
        </div>
      )}
    </div>
  )
}

export interface MobileCardProps {
  children: ReactNode
  onClick?: () => void
}

const MobileCard: React.FC<MobileCardProps> = ({ children, onClick }) => (
  <Card className={styles.card} onClick={onClick}>
    {children}
  </Card>
)

export interface MobileCardHeaderProps {
  children: ReactNode
}

const MobileCardHeader: React.FC<MobileCardHeaderProps> = ({ children }) => (
  <div className={styles.cardHeader}>{children}</div>
)

export interface MobileCardTitleProps {
  children: ReactNode
  style?: React.CSSProperties
}

const MobileCardTitle: React.FC<MobileCardTitleProps> = ({ children, style }) => (
  <div className={styles.cardTitle} style={style}>
    {children}
  </div>
)

export interface MobileCardMetaProps {
  children: ReactNode
}

const MobileCardMeta: React.FC<MobileCardMetaProps> = ({ children }) => (
  <div className={styles.cardMeta}>{children}</div>
)

export interface MobileCardFooterProps {
  left?: ReactNode
  actions?: ReactNode
}

const MobileCardFooter: React.FC<MobileCardFooterProps> = ({ left, actions }) => (
  <div className={styles.cardFooter}>
    <div className={styles.cardDate}>{left}</div>
    <div className={styles.cardActions}>{actions}</div>
  </div>
)

export interface MobileCardActionProps {
  onEdit?: () => void
  onDelete?: () => void
  editTooltip?: string
  deleteTooltip?: string
  deleteConfirm?: string
  extraActions?: ReactNode
}

const MobileCardActions: React.FC<MobileCardActionProps> = ({
  onEdit,
  onDelete,
  editTooltip = '编辑',
  deleteTooltip = '删除',
  deleteConfirm = '确定要删除吗？',
  extraActions,
}) => (
  <Space size={4}>
    {extraActions}
    {onEdit && (
      <Tooltip title={editTooltip}>
        <Button type="text" size="small" icon={<EditOutlined />} onClick={onEdit} />
      </Tooltip>
    )}
    {onDelete && (
      <Popconfirm
        title={deleteConfirm}
        onConfirm={onDelete}
        okText="确定"
        cancelText="取消"
      >
        <Tooltip title={deleteTooltip}>
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Tooltip>
      </Popconfirm>
    )}
  </Space>
)

export function withMobileTable<T extends { id: string }>(
  DesktopComponent: React.FC,
  MobileComponent: React.FC<{ data: T[]; loading?: boolean }>
) {
  return (props: any) => {
    const isMobile = useIsMobile()
    if (isMobile) {
      return <MobileComponent {...props} />
    }
    return <DesktopComponent {...props} />
  }
}

export const MobileTable = Object.assign(MobileTableInner, {
  Card: MobileCard,
  CardHeader: MobileCardHeader,
  CardTitle: MobileCardTitle,
  CardMeta: MobileCardMeta,
  CardFooter: MobileCardFooter,
  CardActions: MobileCardActions,
})
