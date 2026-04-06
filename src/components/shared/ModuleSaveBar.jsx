import { Space, Button, Typography } from 'antd';
import { AlertTriangle, CheckCircle, Save } from 'lucide-react';
import { fmtDate } from '../../utils/helpers.jsx';

const { Text } = Typography;

export default function ModuleSaveBar({ moduleName, isDirty, onSave, lastSaved }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 16px',
      background: isDirty ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.06)',
      border: `1px solid ${isDirty ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.2)'}`,
      borderRadius: 8, marginBottom: 12,
    }}>
      <Space>
        {isDirty ? (
          <>
            <AlertTriangle size={14} color="#faad14" />
            <Text style={{ fontSize: 12, color: '#f59e0b' }}>
              Unsaved changes in <strong>{moduleName}</strong>
            </Text>
          </>
        ) : (
          <>
            <CheckCircle size={14} color="#52c41a" />
            <Text style={{ fontSize: 12, color: '#22c55e' }}>
              <strong>{moduleName}</strong> — all changes saved
            </Text>
          </>
        )}
        {lastSaved && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            Last saved: {fmtDate(lastSaved)}
          </Text>
        )}
      </Space>
      <Button
        size="small"
        type={isDirty ? 'primary' : 'default'}
        icon={<Save size={13} />}
        onClick={onSave}
        disabled={!isDirty}
        style={isDirty ? { background: '#217346', borderColor: '#217346' } : {}}
      >
        Save {moduleName}
      </Button>
    </div>
  );
}
