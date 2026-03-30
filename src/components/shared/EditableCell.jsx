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
        onChange={(e) => setVal(e.target.value)}
        onPressEnter={save}
        onBlur={save}
        className="editable-input"
      />
    );
  }

  return (
    <div className="editable-cell" onClick={() => setEditing(true)} title="Click to edit">
      {value || <span className="cell-placeholder">—</span>}
    </div>
  );
}
