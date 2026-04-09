import { useState, useRef, useEffect } from 'react';
import { Input } from 'antd';

export default function EditableCell({ value, record, dataIndex, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val,     setVal]     = useState(value);
  const inputRef              = useRef(null);

  useEffect(() => { setVal(value); }, [value]);
  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const save = () => {
    setEditing(false);
    if (val !== value) onSave(record.key, dataIndex, val);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        size="small"
        value={val}
        aria-label={`Edit ${dataIndex}`}
        onChange={(e) => setVal(e.target.value)}
        onPressEnter={save}
        onBlur={save}
        className="editable-input"
      />
    );
  }

  return (
    <div
      className="editable-cell"
      role="button"
      tabIndex={0}
      aria-label={`Edit ${dataIndex}: ${value || 'empty'}`}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(true); } }}
    >
      {value || <span className="cell-placeholder" aria-hidden="true">—</span>}
    </div>
  );
}
