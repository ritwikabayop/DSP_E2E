import { Tag } from 'antd';
import { Select } from 'antd';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { STATUS_OPTIONS } from '../../utils/constants.js';
import { statusColor, isHighPriority } from '../../utils/helpers.jsx';

export default function StatusSelect({ value, record, onSave, readOnly }) {
  const color = statusColor(value);

  const icon =
    color === 'success' ? <CheckCircle size={10} /> :
    color === 'error'   ? <XCircle size={10} /> :
                          <Clock size={10} />;

  const tagStyle = isHighPriority(value) ? { fontWeight: 600, fontStyle: 'italic' } : {};

  if (readOnly) {
    return (
      <Tag color={color} icon={icon} style={tagStyle}>
        {value || 'Not Started'}
      </Tag>
    );
  }

  return (
    <Select
      size="small"
      value={value || ''}
      onChange={(v) => onSave(record.key, 'status', v)}
      options={STATUS_OPTIONS}
      style={{ width: '100%', minWidth: 150 }}
      popupMatchSelectWidth={false}
      variant="borderless"
      className="status-select"
      labelRender={({ label }) => (
        <Tag color={color} icon={icon} style={tagStyle}>
          {label || 'Not Started'}
        </Tag>
      )}
    />
  );
}
