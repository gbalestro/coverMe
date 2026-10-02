import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BoxArrowInRight, ShieldCheck, Person } from 'react-bootstrap-icons';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'ORGANIZATION') {
        navigate('/club/dashboard');
      } else {
        navigate('/coach/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <Container className="py-5" style={{ maxWidth: '480px' }}>
      <Card className="glass-card p-4 border-0 shadow-lg mt-4">
        <div className="text-center mb-4">
          <h2 className="fw-bold brand-gradient">coverMe</h2>
          <p className="text-muted small">Sign in to manage your club roster or coach availability</p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Email Address</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. club@olympicgym.com"
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="small fw-bold">Password</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Form.Group>

          <Button type="submit" className="btn-primary-gradient w-100 py-2 fs-6 mb-3" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'} <BoxArrowInRight className="ms-1" />
          </Button>
        </Form>

        {/* Demo Fast Login Buttons for Presentations */}
        <div className="border-top pt-3 mt-3">
          <p className="text-muted small text-center mb-2 fw-semibold">Quick Presentation Demo Logins:</p>
          <div className="d-grid gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              className="text-start d-flex align-items-center justify-content-between"
              onClick={() => handleQuickLogin('london@olympicgym.com', 'ClubPass123!')}
            >
              <span><ShieldCheck className="me-2" /> Olympic Gymnastics Academy (Club)</span>
              <small className="badge bg-primary text-white">Fill</small>
            </Button>
            <Button
              variant="outline-success"
              size="sm"
              className="text-start d-flex align-items-center justify-content-between"
              onClick={() => handleQuickLogin('sarah.coach@gymcover.com', 'CoachPass123!')}
            >
              <span><Person className="me-2" /> Coach Sarah Jenkins (Level 3 WAG)</span>
              <small className="badge bg-success text-white">Fill</small>
            </Button>
          </div>
        </div>

        <div className="text-center mt-4">
          <span className="small text-muted">Don't have an account? </span>
          <Link to="/register" className="small fw-bold text-primary">
            Create an account
          </Link>
        </div>
      </Card>
    </Container>
  );
};
