import { useState } from 'react';
import { Form, Input, Button, Typography, Alert, Space } from 'antd';
import { LayoutDashboard, Mail, Lock, LogIn, ShieldCheck, FileSpreadsheet } from 'lucide-react';

const { Title, Text } = Typography;

export default function LoginPage({ onSignIn }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleFinish = async ({ email, password }) => {
    setError('');
    setLoading(true);
    const { error: err } = await onSignIn(email, password);
    if (err) setError(err.message || 'Login failed.');
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0d0f18', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', top: '-120px', left: '-120px', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-80px', right: '-80px', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Left branding panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px', borderRight: '1px solid #1e2332', background: 'linear-gradient(160deg, #0f1822 0%, #0d0f18 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(34,197,94,0.3)' }}>
            <LayoutDashboard size={26} color="#fff" />
          </div>
          <div>
            <Title level={3} style={{ margin: 0, color: '#e2e8f0', lineHeight: 1.2, fontSize: 20 }}>MyISP</Title>
            <Text style={{ color: '#4b5568', fontSize: 12 }}>Insight &amp; Status Platform</Text>
          </div>
        </div>
        <Title level={1} style={{ color: '#e2e8f0', marginBottom: 12, fontSize: 36, lineHeight: 1.15, fontWeight: 800 }}>Welcome back</Title>
        <Text style={{ color: '#64748b', fontSize: 15, lineHeight: 1.7, display: 'block', marginBottom: 40, maxWidth: 380 }}>Your central hub for DSP, SSA, team testing data and attendance insights. Sign in to continue.</Text>
        <Space direction='vertical' size={14}>
          {[{ Icon: ShieldCheck, label: 'Role-based access control' }, { Icon: FileSpreadsheet, label: 'Real-time data sync via Supabase' }, { Icon: LogIn, label: 'Secure Supabase authentication' }].map(({ Icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={14} color="#22c55e" />
              </div>
              <Text style={{ color: '#8892a4', fontSize: 13 }}>{label}</Text>
            </div>
          ))}
        </Space>
      </div>

      {/* Right login panel */}
      <div style={{ width: 460, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px', background: '#0d0f18' }}>
        <div style={{ marginBottom: 32 }}>
          <Title level={2} style={{ color: '#e2e8f0', margin: '0 0 6px', fontSize: 26 }}>Sign in</Title>
          <Text style={{ color: '#64748b', fontSize: 13 }}>Enter your credentials to access the dashboard</Text>
        </div>
        {error && <Alert message={error} type='error' showIcon closable onClose={() => setError('')} style={{ marginBottom: 20, borderRadius: 8 }} />}
        <Form layout='vertical' onFinish={handleFinish} requiredMark={false}>
          <Form.Item label={<Text style={{ color: '#8892a4', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>Email address</Text>} name='email' rules={[{ required: true, message: 'Please enter your email' }, { type: 'email', message: 'Enter a valid email' }]}>
            <Input size='large' prefix={<Mail size={15} color='#4b5568' style={{ marginRight: 4 }} />} placeholder='you@example.com' autoComplete='email' style={{ borderRadius: 9, height: 44 }} />
          </Form.Item>
          <Form.Item label={<Text style={{ color: '#8892a4', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>Password</Text>} name='password' rules={[{ required: true, message: 'Please enter your password' }]} style={{ marginBottom: 28 }}>
            <Input.Password size='large' prefix={<Lock size={15} color='#4b5568' style={{ marginRight: 4 }} />} placeholder='Enter your password' autoComplete='current-password' style={{ borderRadius: 9, height: 44 }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type='primary' htmlType='submit' size='large' loading={loading} icon={<LogIn size={16} />} style={{ width: '100%', height: 46, borderRadius: 9, background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', border: 'none', fontWeight: 700, fontSize: 15, boxShadow: '0 4px 14px rgba(34,197,94,0.3)' }}>
            {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Form.Item>
        </Form>
        <Text style={{ color: '#374151', fontSize: 11, textAlign: 'center', marginTop: 28, display: 'block' }}>Contact your admin to create or reset your account.</Text>
      </div>
    </div>
  );
}
