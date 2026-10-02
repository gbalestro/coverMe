import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { workerAPI, organizationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, GeoAlt, Award, Clock, ShieldCheck, CheckCircleFill, PersonPlus } from 'react-bootstrap-icons';

export const DiscoverPage = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [level, setLevel] = useState('');
  const [city, setCity] = useState('');
  const [approvedOnly, setApprovedOnly] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const { isClub } = useAuth();

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const fetchCoaches = async () => {
    setLoading(true);
    try {
      const res = await workerAPI.searchCoaches({
        day,
        discipline,
        level,
        city,
        approved_only: approvedOnly,
      });
      setCoaches(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoaches();
  }, [day, discipline, level, approvedOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCoaches();
  };

  const handleQuickAddToRoster = async (coachEmail) => {
    try {
      await organizationAPI.addCoachByEmail(coachEmail, 'APPROVED', 'Added via Discovery search');
      setActionSuccess(`Coach ${coachEmail} has been added to your club roster as Approved!`);
      fetchCoaches();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Discover Gymnastics Coaches</h2>
        <p className="text-secondary small">
          Search qualified coaches by available days, British Gymnastics disciplines, and coaching level.
        </p>
      </div>

      {actionSuccess && (
        <Alert variant="success" dismissible onClose={() => setActionSuccess('')}>
          {actionSuccess}
        </Alert>
      )}

      {/* Filter Bar */}
      <Card className="glass-card border-0 p-3 mb-4 shadow-sm">
        <Form onSubmit={handleSearchSubmit}>
          <Row className="g-2 align-items-end">
            <Col md={3}>
              <Form.Label className="small fw-bold">Available Day</Form.Label>
              <Form.Select value={day} onChange={(e) => setDay(e.target.value)}>
                <option value="">Any Day</option>
                {dayNames.map((name, idx) => (
                  <option key={name} value={idx}>{name}</option>
                ))}
              </Form.Select>
            </Col>

            <Col md={3}>
              <Form.Label className="small fw-bold">Discipline</Form.Label>
              <Form.Select value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
                <option value="">All Disciplines</option>
                <option value="Women's Artistic">Women's Artistic (WAG)</option>
                <option value="Men's Artistic">Men's Artistic (MAG)</option>
                <option value="Trampoline">Trampoline</option>
                <option value="Acrobatic Gymnastics">Acrobatic Gymnastics</option>
                <option value="Pre-School Gymnastics">Pre-School Gymnastics</option>
                <option value="Tumbling">Tumbling</option>
              </Form.Select>
            </Col>

            <Col md={2}>
              <Form.Label className="small fw-bold">Min Level</Form.Label>
              <Form.Select value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="">Any Level</option>
                <option value="Level 1">Level 1+</option>
                <option value="Level 2">Level 2+</option>
                <option value="Level 3">Level 3+</option>
                <option value="Level 4">Level 4+</option>
              </Form.Select>
            </Col>

            <Col md={2}>
              <Form.Label className="small fw-bold">City / Location</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. London"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </Col>

            <Col md={2}>
              <Button type="submit" className="btn-primary-gradient w-100">
                <Search className="me-1" /> Filter
              </Button>
            </Col>
          </Row>

          {isClub && (
            <div className="mt-3 pt-2 border-top">
              <Form.Check
                type="switch"
                id="approved-only-switch"
                label="Only show coaches already Approved on my Club Roster"
                checked={approvedOnly}
                onChange={(e) => setApprovedOnly(e.target.checked)}
                className="small fw-semibold text-primary"
              />
            </div>
          )}
        </Form>
      </Card>

      {/* Results Grid */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Searching matching coaches...</p>
        </div>
      ) : coaches.length === 0 ? (
        <div className="text-center py-5">
          <h5>No coaches match the current criteria.</h5>
          <p className="text-muted small">Try broadening your discipline or day filters.</p>
        </div>
      ) : (
        <Row className="g-4">
          {coaches.map((c) => (
            <Col md={6} lg={4} key={c.id}>
              <Card className="glass-card border-0 p-4 h-100 shadow-sm d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 className="fw-bold mb-0 text-dark">{c.full_name}</h5>
                    <small className="text-muted d-flex align-items-center gap-1 mt-1">
                      <GeoAlt size={12} /> {c.city || 'UK'}
                    </small>
                  </div>
                  <span className="fw-bold text-success fs-5">£{c.hourly_rate}/hr</span>
                </div>

                <p className="text-secondary small mb-3">{c.headline || 'Gymnastics Coach'}</p>

                {/* Compliance Badges */}
                <div className="d-flex flex-wrap gap-1 mb-3">
                  {c.dbs_checked && (
                    <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25 small">
                      DBS Verified ✓
                    </Badge>
                  )}
                  {c.safeguarding_certified && (
                    <Badge bg="info" className="bg-opacity-10 text-info border border-info border-opacity-25 small">
                      Safeguarding ✓
                    </Badge>
                  )}
                </div>

                {/* Qualifications */}
                <div className="mb-3">
                  <div className="text-muted small fw-semibold mb-1">Qualifications:</div>
                  {c.qualifications?.length > 0 ? (
                    c.qualifications.map((q) => (
                      <span key={q.id} className="discipline-tag">
                        {q.discipline} ({q.level})
                      </span>
                    ))
                  ) : (
                    <span className="text-muted small">No qualifications added</span>
                  )}
                </div>

                {/* Available Days */}
                <div className="mb-3">
                  <div className="text-muted small fw-semibold mb-1">Available Hours:</div>
                  <div className="d-flex flex-wrap gap-1">
                    {c.availability_slots?.length > 0 ? (
                      c.availability_slots.map((s) => (
                        <span key={s.id} className="day-badge">
                          {s.day_name} ({s.start_time.slice(0, 5)})
                        </span>
                      ))
                    ) : (
                      <span className="text-muted small">Open to inquiry</span>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                  {isClub ? (
                    c.club_approval_status === 'APPROVED' ? (
                      <span className="badge-approved small">
                        <CheckCircleFill className="me-1" /> Approved on Roster
                      </span>
                    ) : c.club_approval_status === 'PENDING' ? (
                      <span className="badge-pending small">Pending Roster Approval</span>
                    ) : (
                      <Button
                        size="sm"
                        className="btn-primary-gradient"
                        onClick={() => handleQuickAddToRoster(c.email)}
                      >
                        <PersonPlus className="me-1" /> Add to Club Roster
                      </Button>
                    )
                  ) : (
                    <span className="small text-muted">Active Coach Profile</span>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};
