import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, ButtonGroup, ToggleButton } from 'react-bootstrap';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Person } from 'react-bootstrap-icons';

export const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'ORGANIZATION' ? 'ORGANIZATION' : 'WORKER';

  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        email,
        password,
        role,
        first_name: firstName,
        last_name: lastName,
        city,
        phone,
        organization_name: role === 'ORGANIZATION' ? orgName : undefined,
      };

      const user = await register(payload);
      if (user.role === 'ORGANIZATION') {
        navigate('/club/dashboard');
      } else {
        navigate('/coach/dashboard');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.email?.[0] ||
        err.response?.data?.password?.[0] ||
        err.response?.data?.detail ||
        'Registration failed. Please review your details.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5" style={{ maxWidth: '540px' }}>
      <Card className="glass-card p-4 border-0 shadow-lg mt-3">
        <div className="text-center mb-4">
          <h2 className="fw-bold brand-gradient">Join coverMe</h2>
          <p className="text-muted small">Choose your account type to get started</p>

          <ButtonGroup className="w-100 mt-2">
            <ToggleButton
              id="tbg-coach"
              type="radio"
              variant={role === 'WORKER' ? 'primary' : 'outline-primary'}
              value="WORKER"
              checked={role === 'WORKER'}
              onChange={(e) => setRole(e.currentTarget.value)}
              className="py-2 fw-semibold"
            >
              <Person className="me-2" /> I am a Coach
            </ToggleButton>
            <ToggleButton
              id="tbg-club"
              type="radio"
              variant={role === 'ORGANIZATION' ? 'primary' : 'outline-primary'}
              value="ORGANIZATION"
              checked={role === 'ORGANIZATION'}
              onChange={(e) => setRole(e.currentTarget.value)}
              className="py-2 fw-semibold"
            >
              <ShieldCheck className="me-2" /> I am a Club Admin
            </ToggleButton>
          </ButtonGroup>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          {role === 'ORGANIZATION' ? (
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Club / Facility Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Heathrow Gymnastics Club"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </Form.Group>
          ) : null}

          <div className="row g-2 mb-3">
            <div className="col">
              <Form.Label className="small fw-bold">First Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="col">
              <Form.Label className="small fw-bold">Last Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col">
              <Form.Label className="small fw-bold">City / Area</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. London"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div className="col">
              <Form.Label className="small fw-bold">Phone Number</Form.Label>
              <Form.Control
                type="tel"
                placeholder="Optional"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Email Address</Form.Label>
            <Form.Control
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="small fw-bold">Password (min 6 characters)</Form.Label>
            <Form.Control
              type="password"
              placeholder="Create secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </Form.Group>

          <Button type="submit" className="btn-primary-gradient w-100 py-2 fs-6 mb-3" disabled={loading}>
            {loading ? 'Creating Account...' : `Register as ${role === 'ORGANIZATION' ? 'Club' : 'Coach'}`}
          </Button>
        </Form>

        <div className="text-center mt-3">
          <span className="small text-muted">Already registered? </span>
          <Link to="/login" className="small fw-bold text-primary">
            Sign In
          </Link>
        </div>
      </Card>
    </Container>
  );
};
