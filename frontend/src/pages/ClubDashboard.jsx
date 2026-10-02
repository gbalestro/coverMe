import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Tab, Tabs, Table, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { organizationAPI, coverAPI } from '../services/api';
import { ShieldCheck, PlusCircle, CheckCircle, XCircle, Clock, CalendarEvent, PersonPlus, GeoAlt } from 'react-bootstrap-icons';

export const ClubDashboard = () => {
  const [club, setClub] = useState(null);
  const [roster, setRoster] = useState([]);
  const [covers, setCovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add coach modal
  const [showAddCoachModal, setShowAddCoachModal] = useState(false);
  const [coachEmail, setCoachEmail] = useState('');
  const [coachStatus, setCoachStatus] = useState('APPROVED');
  const [coachNotes, setCoachNotes] = useState('');
  const [addingCoach, setAddingCoach] = useState(false);

  // Create cover request modal
  const [showCreateCoverModal, setShowCreateCoverModal] = useState(false);
  const [coverTitle, setCoverTitle] = useState('');
  const [coverDate, setCoverDate] = useState('');
  const [coverStartTime, setCoverStartTime] = useState('09:00');
  const [coverEndTime, setCoverEndTime] = useState('13:00');
  const [coverDiscipline, setCoverDiscipline] = useState("Women's Artistic");
  const [coverLevel, setCoverLevel] = useState('Level 2');
  const [coverRate, setCoverRate] = useState('35.00');
  const [coverNotes, setCoverNotes] = useState('');
  const [creatingCover, setCreatingCover] = useState(false);

  // View applications modal
  const [selectedCover, setSelectedCover] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clubRes, rosterRes, coversRes] = await Promise.all([
        organizationAPI.getMyClub(),
        organizationAPI.getRoster(),
        coverAPI.getRequests(),
      ]);
      setClub(clubRes.data);
      setRoster(rosterRes.data);
      setCovers(coversRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load club details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (rosterId, newStatus) => {
    try {
      await organizationAPI.setCoachStatus(rosterId, newStatus);
      setSuccess(`Coach status updated to ${newStatus}.`);
      const updatedRoster = await organizationAPI.getRoster();
      setRoster(updatedRoster.data);
    } catch (err) {
      setError('Failed to update coach status.');
    }
  };

  const handleAddCoach = async (e) => {
    e.preventDefault();
    setAddingCoach(true);
    setError('');
    try {
      await organizationAPI.addCoachByEmail(coachEmail, coachStatus, coachNotes);
      setSuccess(`Coach ${coachEmail} added to roster!`);
      setShowAddCoachModal(false);
      setCoachEmail('');
      setCoachNotes('');
      const updatedRoster = await organizationAPI.getRoster();
      setRoster(updatedRoster.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add coach to roster.');
    } finally {
      setAddingCoach(false);
    }
  };

  const handleCreateCover = async (e) => {
    e.preventDefault();
    setCreatingCover(true);
    setError('');
    try {
      await coverAPI.createRequest({
        title: coverTitle,
        date: coverDate,
        start_time: coverStartTime,
        end_time: coverEndTime,
        discipline_required: coverDiscipline,
        min_level_required: coverLevel,
        hourly_rate: coverRate,
        notes: coverNotes,
      });
      setSuccess('Cover request published successfully!');
      setShowCreateCoverModal(false);
      const updatedCovers = await coverAPI.getRequests();
      setCovers(updatedCovers.data);
    } catch (err) {
      setError('Failed to create cover request.');
    } finally {
      setCreatingCover(false);
    }
  };

  const handleViewApplications = async (cover) => {
    setSelectedCover(cover);
    setLoadingApps(true);
    try {
      const res = await coverAPI.getApplications(cover.id);
      setApplications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleAcceptApplicant = async (applicationId) => {
    if (!selectedCover) return;
    try {
      await coverAPI.acceptApplication(selectedCover.id, applicationId);
      setSuccess('Coach accepted and cover confirmed!');
      setSelectedCover(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept applicant.');
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Loading club management console...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header Overview Card */}
      <Card className="glass-card border-0 p-4 mb-4 shadow-sm">
        <Row className="align-items-center">
          <Col md={8}>
            <div className="d-flex align-items-center gap-2 mb-1">
              <ShieldCheck size={28} className="text-primary" />
              <h2 className="fw-bold mb-0">{club?.name || 'My Gymnastics Club'}</h2>
              <Badge bg="success" className="ms-2">Vetted Club</Badge>
            </div>
            <p className="text-muted mb-2 d-flex align-items-center gap-2">
              <GeoAlt size={14} /> {club?.city || 'UK'} • Head Coach: <strong>{club?.head_coach_name || 'Director'}</strong>
            </p>
            <p className="text-secondary small mb-0">{club?.description}</p>
          </Col>
          <Col md={4} className="text-md-end mt-3 mt-md-0">
            <Button className="btn-primary-gradient me-2" onClick={() => setShowCreateCoverModal(true)}>
              <PlusCircle className="me-2" /> Post Cover Request
            </Button>
            <Button variant="outline-custom" onClick={() => setShowAddCoachModal(true)}>
              <PersonPlus className="me-2" /> Add Coach
            </Button>
          </Col>
        </Row>
      </Card>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Main Tabs */}
      <Tabs defaultActiveKey="roster" id="club-tabs" className="mb-4">
        {/* TAB 1: ROSTER & VETTING */}
        <Tab eventKey="roster" title={`Club Roster & Vetted Coaches (${roster.length})`}>
          <Card className="glass-card border-0 p-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0">Authorized Coach Roster</h5>
                <small className="text-muted">Only coaches marked "Approved" can be assigned or accept covers for your club.</small>
              </div>
              <Button size="sm" variant="outline-primary" onClick={() => setShowAddCoachModal(true)}>
                <PersonPlus className="me-1" /> Add Coach to Roster
              </Button>
            </div>

            {roster.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted mb-2">No coaches on your club roster yet.</p>
                <Button size="sm" className="btn-primary-gradient" onClick={() => setShowAddCoachModal(true)}>
                  Add Your First Coach
                </Button>
              </div>
            ) : (
              <Table responsive hover className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Coach Name</th>
                    <th>Qualifications</th>
                    <th>Compliance Checks</th>
                    <th>Rate</th>
                    <th>Vetting Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <strong>{entry.worker_details?.full_name}</strong>
                        <div className="small text-muted">{entry.worker_details?.email}</div>
                        {entry.notes && <div className="text-muted fst-italic" style={{ fontSize: '0.75rem' }}>Note: {entry.notes}</div>}
                      </td>
                      <td>
                        {entry.worker_details?.qualifications?.length > 0 ? (
                          entry.worker_details.qualifications.map((q) => (
                            <span key={q.id} className="discipline-tag">
                              {q.discipline} ({q.level})
                            </span>
                          ))
                        ) : (
                          <span className="text-muted small">No qualifications listed</span>
                        )}
                      </td>
                      <td>
                        {entry.worker_details?.dbs_checked && (
                          <Badge bg="success" className="me-1 small">DBS ✓</Badge>
                        )}
                        {entry.worker_details?.safeguarding_certified && (
                          <Badge bg="info" className="me-1 small">Safeguarding ✓</Badge>
                        )}
                        {entry.worker_details?.insurance_valid && (
                          <Badge bg="secondary" className="small">Insured ✓</Badge>
                        )}
                      </td>
                      <td>
                        <span className="fw-semibold">£{entry.worker_details?.hourly_rate}/hr</span>
                      </td>
                      <td>
                        {entry.status === 'APPROVED' && (
                          <span className="badge-approved">Approved</span>
                        )}
                        {entry.status === 'PENDING' && (
                          <span className="badge-pending">Pending Review</span>
                        )}
                        {entry.status === 'REVOKED' && (
                          <span className="badge-revoked">Revoked</span>
                        )}
                      </td>
                      <td className="text-end">
                        {entry.status !== 'APPROVED' && (
                          <Button
                            size="sm"
                            variant="success"
                            className="me-1 py-1 px-2"
                            onClick={() => handleStatusChange(entry.id, 'APPROVED')}
                            title="Approve this coach for cover"
                          >
                            <CheckCircle className="me-1" /> Approve
                          </Button>
                        )}
                        {entry.status !== 'REVOKED' && (
                          <Button
                            size="sm"
                            variant="outline-danger"
                            className="py-1 px-2"
                            onClick={() => handleStatusChange(entry.id, 'REVOKED')}
                            title="Revoke cover authorization"
                          >
                            <XCircle className="me-1" /> Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </Tab>

        {/* TAB 2: COVER REQUESTS */}
        <Tab eventKey="covers" title={`Cover Requests (${covers.length})`}>
          <Card className="glass-card border-0 p-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0">Club Cover Schedule & Shifts</h5>
                <small className="text-muted">Post cover requests when regular staff are away or sick.</small>
              </div>
              <Button size="sm" className="btn-primary-gradient" onClick={() => setShowCreateCoverModal(true)}>
                <PlusCircle className="me-1" /> Post New Cover Request
              </Button>
            </div>

            {covers.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted mb-2">No active cover requests posted yet.</p>
                <Button size="sm" className="btn-primary-gradient" onClick={() => setShowCreateCoverModal(true)}>
                  Create Your First Request
                </Button>
              </div>
            ) : (
              <Row className="g-3">
                {covers.map((c) => (
                  <Col md={6} key={c.id}>
                    <Card className="border p-3 rounded-3 h-100 shadow-sm">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="fw-bold mb-0 text-primary">{c.title}</h6>
                        <Badge bg={c.status === 'CONFIRMED' ? 'success' : c.status === 'OPEN' ? 'warning' : 'secondary'}>
                          {c.status_display}
                        </Badge>
                      </div>
                      <p className="small text-muted mb-2 d-flex align-items-center gap-2">
                        <CalendarEvent size={13} /> {c.date} ({c.start_time} - {c.end_time})
                      </p>
                      <div className="mb-2">
                        <span className="discipline-tag">{c.discipline_required}</span>
                        <span className="level-tag">{c.min_level_required}+</span>
                        <span className="fw-bold text-success small ms-2">£{c.hourly_rate}/hr</span>
                      </div>
                      {c.notes && <p className="small text-secondary mb-3">{c.notes}</p>}

                      <div className="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
                        {c.status === 'CONFIRMED' ? (
                          <span className="small text-success fw-bold">
                            Assigned to: {c.assigned_worker_name}
                          </span>
                        ) : (
                          <span className="small text-muted">
                            {c.applications_count} Coach Application(s)
                          </span>
                        )}

                        {c.status === 'OPEN' && (
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => handleViewApplications(c)}
                          >
                            Review Applications ({c.applications_count})
                          </Button>
                        )}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Tab>
      </Tabs>

      {/* MODAL: ADD COACH BY EMAIL */}
      <Modal show={showAddCoachModal} onHide={() => setShowAddCoachModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-5 fw-bold">Add Coach to Club Roster</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddCoach}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Coach Registered Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="e.g. sarah.coach@gymcover.com"
                value={coachEmail}
                onChange={(e) => setCoachEmail(e.target.value)}
                required
              />
              <Form.Text className="text-muted">
                Coach must have an account on coverMe.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Initial Vetting Status</Form.Label>
              <Form.Select value={coachStatus} onChange={(e) => setCoachStatus(e.target.value)}>
                <option value="APPROVED">Approved (Authorized to accept covers)</option>
                <option value="PENDING">Pending Review (Awaiting documents/induction)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Vetting Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="e.g. DBS checked, WAG Level 3 verified"
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowAddCoachModal(false)}>Cancel</Button>
            <Button type="submit" className="btn-primary-gradient" disabled={addingCoach}>
              {addingCoach ? 'Adding...' : 'Add to Roster'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* MODAL: CREATE COVER REQUEST */}
      <Modal show={showCreateCoverModal} onHide={() => setShowCreateCoverModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fs-5 fw-bold">Post New Cover Request</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateCover}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Class / Squad Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Saturday Advanced WAG Squad"
                value={coverTitle}
                onChange={(e) => setCoverTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Row className="g-2 mb-3">
              <Col md={4}>
                <Form.Label className="small fw-bold">Date</Form.Label>
                <Form.Control
                  type="date"
                  value={coverDate}
                  onChange={(e) => setCoverDate(e.target.value)}
                  required
                />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Start Time</Form.Label>
                <Form.Control
                  type="time"
                  value={coverStartTime}
                  onChange={(e) => setCoverStartTime(e.target.value)}
                  required
                />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">End Time</Form.Label>
                <Form.Control
                  type="time"
                  value={coverEndTime}
                  onChange={(e) => setCoverEndTime(e.target.value)}
                  required
                />
              </Col>
            </Row>

            <Row className="g-2 mb-3">
              <Col md={4}>
                <Form.Label className="small fw-bold">Discipline</Form.Label>
                <Form.Select value={coverDiscipline} onChange={(e) => setCoverDiscipline(e.target.value)}>
                  <option value="Women's Artistic">Women's Artistic (WAG)</option>
                  <option value="Men's Artistic">Men's Artistic (MAG)</option>
                  <option value="Trampoline">Trampoline</option>
                  <option value="Acrobatic Gymnastics">Acrobatic Gymnastics</option>
                  <option value="Pre-School Gymnastics">Pre-School Gymnastics</option>
                  <option value="Tumbling">Tumbling</option>
                  <option value="General Gymnastics">General Gymnastics</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Minimum Level Required</Form.Label>
                <Form.Select value={coverLevel} onChange={(e) => setCoverLevel(e.target.value)}>
                  <option value="Level 1">Level 1 - Assistant</option>
                  <option value="Level 2">Level 2 - Lead Coach</option>
                  <option value="Level 3">Level 3 - Senior Coach</option>
                  <option value="Level 4">Level 4 - High Performance</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Offered Hourly Rate (£/hr)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.5"
                  value={coverRate}
                  onChange={(e) => setCoverRate(e.target.value)}
                  required
                />
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Lesson Instructions & Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Lesson plan location, key focuses, gymnastics level of gymnasts"
                value={coverNotes}
                onChange={(e) => setCoverNotes(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowCreateCoverModal(false)}>Cancel</Button>
            <Button type="submit" className="btn-primary-gradient" disabled={creatingCover}>
              {creatingCover ? 'Publishing...' : 'Publish Cover Request'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* MODAL: VIEW APPLICANTS */}
      <Modal show={!!selectedCover} onHide={() => setSelectedCover(null)} centered size="md">
        <Modal.Header closeButton>
          <Modal.Title className="fs-5 fw-bold">Applicants for {selectedCover?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingApps ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
            </div>
          ) : applications.length === 0 ? (
            <p className="text-muted text-center py-3">No coaches have applied for this cover yet.</p>
          ) : (
            <div className="d-grid gap-3">
              {applications.map((app) => (
                <Card key={app.id} className="border p-3 shadow-sm rounded-3">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h6 className="fw-bold mb-0">{app.worker_name}</h6>
                    <Badge bg={app.status === 'ACCEPTED' ? 'success' : 'info'}>{app.status_display}</Badge>
                  </div>
                  <div className="small text-muted mb-2">
                    {app.worker_email} • {app.worker_phone || 'No phone'} • £{app.hourly_rate}/hr
                  </div>
                  {app.pitch_note && (
                    <p className="small text-secondary bg-light p-2 rounded mb-2">
                      "{app.pitch_note}"
                    </p>
                  )}
                  {app.status === 'PENDING' && (
                    <Button
                      size="sm"
                      className="btn-primary-gradient mt-1"
                      onClick={() => handleAcceptApplicant(app.id)}
                    >
                      <CheckCircle className="me-1" /> Accept Coach for this Cover
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};
