import { Select } from 'antd';

export default function InlineSelect({ value, record, dataIndex, onSave, options }) {
  return (
    <Select
      size="small"
      value={value}
      onChange={(v) => onSave(record.key, dataIndex, v)}
      options={options}
      style={{ width: '100%', minWidth: 80 }}
      popupMatchSelectWidth={false}
      variant="borderless"
    />
  );
}
