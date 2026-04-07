import { Space, Button, Typography } from 'antd';
import { AlertTriangle, CheckCircle, Save } from 'lucide-react';
import { fmtDate } from '../../utils/helpers.jsx';

const { Text } = Typography;

export default function ModuleSaveBar({ moduleName, isDirty, onSave, lastSaved }) {
  return (
    <div
      className={isDirty ? 'module-save-bar-dirty' : 'module-save-bar-clean'}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px', borderRadius: 8, marginBottom: 12 }}
    >
      <Space>
        <span aria-live="polite" aria-atomic="true" style={{ display: 'contents' }}>
          {isDirty ? (
            <>
              <AlertTriangle size={14} color="var(--warning)" aria-hidden="true" />
              <Text style={{ fontSize: 12, color: 'var(--warning)' }}>
                Unsaved changes in <strong>{moduleName}</strong>
              </Text>
            </>
          ) : (
            <>
              <CheckCircle size={14} color="var(--accent)" aria-hidden="true" />
              <Text style={{ fontSize: 12, color: 'var(--accent)' }}>
                <strong>{moduleName}</strong> — all changes saved
              </Text>
            </>
          )}
        </span>
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
        style={isDirty ? { background: 'var(--excel-green)', borderColor: 'var(--excel-green)' } : {}}
      >
        Save {moduleName}
      </Button>
    </div>
  );
}
