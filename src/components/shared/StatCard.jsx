import { Card, Typography, Progress } from 'antd';
import { useState, useEffect } from 'react';

const { Text } = Typography;

function useTheme() {
  const [isLight, setIsLight] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'light'
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsLight(document.documentElement.getAttribute('data-theme') === 'light')
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return isLight;
}

export default function StatCard({ icon: Icon, title, value, color, total, iconBg }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  const isLight = useTheme();

  return (
    <Card className="stat-card" style={{ borderLeft: `4px solid ${color}` }} size="small">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: iconBg || `${color}${isLight ? '33' : '18'}`,
        }}>
          <Icon size={20} color={color} aria-hidden="true" />
        </div>
        <div style={{ flex: 1 }}>
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{title}</Text>
          <Text strong style={{ fontSize: 22, color, lineHeight: 1.1 }}>{value}</Text>
        </div>
        {total > 0 && (
          <Progress
            type="circle"
            percent={pct}
            size={38}
            strokeColor={color}
            format={() => `${pct}%`}
            strokeWidth={8}
          />
        )}
      </div>
    </Card>
  );
}
