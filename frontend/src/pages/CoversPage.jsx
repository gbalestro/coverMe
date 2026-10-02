import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { coverAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { CalendarEvent, Clock, GeoAlt, ShieldCheck, Lock, CheckCircle } from 'react-bootstrap-icons';

export const CoversPage = () => {
  const [covers, setCovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Apply modal
  const [selectedCover, setSelectedCover] = useState(null);
  const [pitchNote, setPitchNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { isAuthenticated, isCoach, isClub } = useAuth();

  const loadCovers = async () => {
    setLoading(true);
    try {
      const res = await coverAPI.getRequests();
      setCovers(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load covers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCovers();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedCover) return;
    setSubmitting(true);
    setError('');
    try {
      await coverAPI.applyForCover(selectedCover.id, pitchNote);
      setSuccess(`Application submitted to ${selectedCover.organization_name}!`);
      setSelectedCover(null);
      setPitchNote('');
      loadCovers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Open Gymnastics Cover Requests</h2>
        <p className="text-secondary small">
          Active session and class cover requests posted by registered gymnastics clubs.
        </p>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading open cover requests...</p>
        </div>
      ) : covers.length === 0 ? (
        <div className="text-center py-5">
          <h5>No cover requests currently open.</h5>
          <p className="text-muted small">Check back soon or ask your club director to post a request.</p>
        </div>
      ) : (
        <Row className="g-4">
          {covers.map((c) => (
            <Col md={6} key={c.id}>
              <Card className="glass-card border-0 p-4 h-100 shadow-sm d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 className="fw-bold mb-1 text-primary">{c.title}</h5>
                    <div className="text-muted small d-flex align-items-center gap-2">
                      <ShieldCheck size={14} className="text-primary" />
                      <strong>{c.organization_name}</strong> • {c.organization_city}
                    </div>
                  </div>
                  <Badge bg={c.status === 'CONFIRMED' ? 'success' : 'warning'}>
                    {c.status_display}
                  </Badge>
                </div>

                <div className="my-2 p-2 bg-light rounded-3 d-flex flex-wrap align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2 text-secondary small">
                    <CalendarEvent size={14} /> <strong>{c.date}</strong>
                    <Clock size={14} className="ms-2" /> {c.start_time} - {c.end_time}
                  </div>
                  <span className="fw-bold text-success">£{c.hourly_rate}/hr</span>
                </div>

                <div className="mb-3">
                  <span className="discipline-tag">{c.discipline_required}</span>
                  <span className="level-tag">Requires {c.min_level_required}+</span>
                </div>

                {c.notes && (
                  <p className="small text-secondary mb-3 fst-italic">
                    "{c.notes}"
                  </p>
                )}

                <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                  <span className="small text-muted">
                    {c.applications_count} applicant(s)
                  </span>

                  {isCoach ? (
                    c.is_user_approved ? (
                      c.has_applied ? (
                        <Badge bg="info" className="py-2 px-3">Application Submitted</Badge>
                      ) : (
                        <Button
                          size="sm"
                          className="btn-primary-gradient"
                          onClick={() => setSelectedCover(c)}
                        >
                          Apply for Cover
                        </Button>
                      )
                    ) : (
                      <span className="badge bg-secondary py-2 px-3 small text-white d-flex align-items-center gap-1" title="You must be approved by this club to apply.">
                        <Lock size={12} /> Club Vetting Required
                      </span>
                    )
                  ) : !isAuthenticated ? (
                    <Button as={Link} to="/login" variant="outline-primary" size="sm">
                      Log in to Apply
                    </Button>
                  ) : isClub ? (
                    <span className="small text-muted">Club View</span>
                  ) : null}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Apply Modal */}
      <Modal show={!!selectedCover} onHide={() => setSelectedCover(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-5 fw-bold">Apply: {selectedCover?.title}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleApply}>
          <Modal.Body>
            <p className="small text-muted mb-3">
              {selectedCover?.organization_name} • {selectedCover?.date} ({selectedCover?.start_time} - {selectedCover?.end_time})
            </p>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Message / Pitch to Club</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Let the club director know your readiness and background..."
                value={pitchNote}
                onChange={(e) => setPitchNote(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setSelectedCover(null)}>Cancel</Button>
            <Button type="submit" className="btn-primary-gradient" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};
