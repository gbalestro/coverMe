import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Tab, Tabs, Form, Modal, Alert, Spinner } from 'react-bootstrap';
import { workerAPI, coverAPI } from '../services/api';
import { Person, CalendarCheck, Award, PlusCircle, Trash, CheckCircleFill, Clock, GeoAlt } from 'react-bootstrap-icons';

export const CoachDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [qualifications, setQualifications] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [covers, setCovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Qualification Modal
  const [showQualModal, setShowQualModal] = useState(false);
  const [qualDiscipline, setQualDiscipline] = useState("Women's Artistic");
  const [qualLevel, setQualLevel] = useState('Level 2');
  const [qualIssuingBody, setQualIssuingBody] = useState('British Gymnastics');
  const [certNumber, setCertNumber] = useState('');
  const [addingQual, setAddingQual] = useState(false);

  // Add Availability Modal
  const [showAvailModal, setShowAvailModal] = useState(false);
  const [availDay, setAvailDay] = useState(0);
  const [availStart, setAvailStart] = useState('16:00');
  const [availEnd, setAvailEnd] = useState('20:00');
  const [availNotes, setAvailNotes] = useState('');
  const [addingAvail, setAddingAvail] = useState(false);

  // Apply to Cover Modal
  const [applyingCover, setApplyingCover] = useState(null);
  const [pitchNote, setPitchNote] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);

  // Edit Profile Form State
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [city, setCity] = useState('');
  const [dbsChecked, setDbsChecked] = useState(false);
  const [safeguarding, setSafeguarding] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profRes, qualRes, availRes, coversRes] = await Promise.all([
        workerAPI.getMyProfile(),
        workerAPI.getQualifications(),
        coverAPI.getAvailability(),
        coverAPI.getRequests(),
      ]);
      setProfile(profRes.data);
      setQualifications(qualRes.data);
      setAvailability(availRes.data);
      setCovers(coversRes.data);

      // Populate edit fields
      setHeadline(profRes.data.headline || '');
      setBio(profRes.data.bio || '');
      setHourlyRate(profRes.data.hourly_rate || '25.00');
      setCity(profRes.data.city || '');
      setDbsChecked(profRes.data.dbs_checked || false);
      setSafeguarding(profRes.data.safeguarding_certified || false);
    } catch (err) {
      console.error(err);
      setError('Failed to load coach profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setError('');
    try {
      const res = await workerAPI.updateMyProfile({
        headline,
        bio,
        hourly_rate: hourlyRate,
        city,
        dbs_checked: dbsChecked,
        safeguarding_certified: safeguarding,
      });
      setProfile(res.data);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAddQual = async (e) => {
    e.preventDefault();
    setAddingQual(true);
    setError('');
    try {
      await workerAPI.addQualification({
        discipline: qualDiscipline,
        level: qualLevel,
        issuing_body: qualIssuingBody,
        certificate_number: certNumber,
      });
      setSuccess('Qualification added!');
      setShowQualModal(false);
      setCertNumber('');
      const updated = await workerAPI.getQualifications();
      setQualifications(updated.data);
    } catch (err) {
      setError('Failed to add qualification.');
    } finally {
      setAddingQual(false);
    }
  };

  const handleDeleteQual = async (id) => {
    try {
      await workerAPI.deleteQualification(id);
      setSuccess('Qualification removed.');
      setQualifications((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      setError('Failed to delete qualification.');
    }
  };

  const handleAddAvail = async (e) => {
    e.preventDefault();
    setAddingAvail(true);
    setError('');
    try {
      await coverAPI.addAvailability({
        day_of_week: parseInt(availDay, 10),
        start_time: availStart,
        end_time: availEnd,
        notes: availNotes,
      });
      setSuccess('Availability slot added!');
      setShowAvailModal(false);
      setAvailNotes('');
      const updated = await coverAPI.getAvailability();
      setAvailability(updated.data);
    } catch (err) {
      setError('Failed to add availability slot.');
    } finally {
      setAddingAvail(false);
    }
  };

  const handleDeleteAvail = async (id) => {
    try {
      await coverAPI.deleteAvailability(id);
      setSuccess('Availability slot removed.');
      setAvailability((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError('Failed to delete slot.');
    }
  };

  const handleApplyCover = async (e) => {
    e.preventDefault();
    if (!applyingCover) return;
    setSubmittingApp(true);
    setError('');
    try {
      await coverAPI.applyForCover(applyingCover.id, pitchNote);
      setSuccess(`Application submitted to ${applyingCover.organization_name}!`);
      setApplyingCover(null);
      setPitchNote('');
      const updated = await coverAPI.getRequests();
      setCovers(updated.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to apply for cover.');
    } finally {
      setSubmittingApp(false);
    }
  };

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Loading coach profile and schedule...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header Profile Card */}
      <Card className="glass-card border-0 p-4 mb-4 shadow-sm">
        <Row className="align-items-center">
          <Col md={8}>
            <div className="d-flex align-items-center gap-2 mb-1">
              <Person size={28} className="text-primary" />
              <h2 className="fw-bold mb-0">{profile?.full_name}</h2>
              <Badge bg="info" className="ms-2">Coach</Badge>
            </div>
            <p className="text-primary fw-semibold mb-2">{profile?.headline || 'Gymnastics Coach & Instructor'}</p>
            <p className="text-muted small mb-2 d-flex align-items-center gap-2">
              <GeoAlt size={14} /> {profile?.city || 'UK'} • Rate: <strong>£{profile?.hourly_rate}/hr</strong>
            </p>
            <div className="d-flex flex-wrap gap-2">
              {profile?.dbs_checked && (
                <span className="badge-approved small">DBS Checked ✓</span>
              )}
              {profile?.safeguarding_certified && (
                <span className="badge-approved small">Safeguarding Certified ✓</span>
              )}
              {profile?.first_aid_certified && (
                <span className="badge-approved small">First Aid ✓</span>
              )}
              {profile?.insurance_valid && (
                <span className="badge-approved small">Insured ✓</span>
              )}
            </div>
          </Col>
          <Col md={4} className="text-md-end mt-3 mt-md-0">
            <Button className="btn-primary-gradient me-2" onClick={() => setShowAvailModal(true)}>
              <CalendarCheck className="me-2" /> Add Free Slot
            </Button>
            <Button variant="outline-custom" onClick={() => setShowQualModal(true)}>
              <Award className="me-2" /> Add Qualification
            </Button>
          </Col>
        </Row>
      </Card>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Tabs defaultActiveKey="covers" id="coach-tabs" className="mb-4">
        {/* TAB 1: OPEN COVERS */}
        <Tab eventKey="covers" title={`Open Club Covers (${covers.length})`}>
          <Card className="glass-card border-0 p-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0">Cover Requests from Your Approved Clubs</h5>
                <small className="text-muted">You are pre-approved to accept sessions from these gymnastics clubs.</small>
              </div>
            </div>

            {covers.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted mb-2">No open cover requests from your approved clubs at the moment.</p>
                <small className="text-secondary">Make sure you have joined a club roster to receive notifications.</small>
              </div>
            ) : (
              <Row className="g-3">
                {covers.map((c) => (
                  <Col md={6} key={c.id}>
                    <Card className="border p-3 rounded-3 h-100 shadow-sm">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="fw-bold mb-0 text-primary">{c.title}</h6>
                        <Badge bg={c.status === 'CONFIRMED' ? 'success' : 'warning'}>
                          {c.status_display}
                        </Badge>
                      </div>
                      <div className="small text-muted mb-1">
                        <strong>{c.organization_name}</strong> • {c.organization_city}
                      </div>
                      <p className="small text-secondary mb-2 d-flex align-items-center gap-2">
                        <Clock size={13} /> {c.date} ({c.start_time} - {c.end_time})
                      </p>
                      <div className="mb-2">
                        <span className="discipline-tag">{c.discipline_required}</span>
                        <span className="level-tag">{c.min_level_required}+</span>
                        <span className="fw-bold text-success small ms-2">£{c.hourly_rate}/hr</span>
                      </div>
                      {c.notes && <p className="small text-muted mb-3">"{c.notes}"</p>}

                      <div className="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
                        {c.status === 'CONFIRMED' ? (
                          <span className="small text-success fw-bold">
                            {c.assigned_worker === profile?.id ? 'Assigned to You!' : 'Covered'}
                          </span>
                        ) : c.has_applied ? (
                          <Badge bg="info" className="py-2 px-3">Application Submitted</Badge>
                        ) : (
                          <Button
                            size="sm"
                            className="btn-primary-gradient"
                            onClick={() => setApplyingCover(c)}
                          >
                            Apply for this Cover
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

        {/* TAB 2: AVAILABILITY SLOTS */}
        <Tab eventKey="availability" title={`Weekly Availability (${availability.length})`}>
          <Card className="glass-card border-0 p-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0">My Available Days & Hours</h5>
                <small className="text-muted">Clubs search for coaches based on these active times.</small>
              </div>
              <Button size="sm" className="btn-primary-gradient" onClick={() => setShowAvailModal(true)}>
                <PlusCircle className="me-1" /> Add Time Slot
              </Button>
            </div>

            {availability.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted mb-2">You haven't listed your availability yet.</p>
                <Button size="sm" className="btn-primary-gradient" onClick={() => setShowAvailModal(true)}>
                  Add Free Days
                </Button>
              </div>
            ) : (
              <Row className="g-3">
                {availability.map((slot) => (
                  <Col md={4} key={slot.id}>
                    <Card className="border p-3 rounded-3 shadow-sm position-relative">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-primary fs-6">{slot.day_name}</span>
                        <Button
                          variant="link"
                          className="text-danger p-0"
                          onClick={() => handleDeleteAvail(slot.id)}
                          title="Delete slot"
                        >
                          <Trash />
                        </Button>
                      </div>
                      <div className="mt-2 text-secondary fw-semibold">
                        <Clock className="me-1 text-muted" /> {slot.start_time} - {slot.end_time}
                      </div>
                      {slot.notes && <small className="text-muted mt-1">{slot.notes}</small>}
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Tab>

        {/* TAB 3: QUALIFICATIONS */}
        <Tab eventKey="qualifications" title={`Qualifications & Levels (${qualifications.length})`}>
          <Card className="glass-card border-0 p-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0">Certified Coaching Qualifications</h5>
                <small className="text-muted">Clubs filter coaches by gymnastics disciplines and coaching levels.</small>
              </div>
              <Button size="sm" variant="outline-primary" onClick={() => setShowQualModal(true)}>
                <Award className="me-1" /> Add Qualification
              </Button>
            </div>

            {qualifications.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted mb-2">No qualifications added yet.</p>
                <Button size="sm" className="btn-primary-gradient" onClick={() => setShowQualModal(true)}>
                  Add Level & Discipline
                </Button>
              </div>
            ) : (
              <Row className="g-3">
                {qualifications.map((q) => (
                  <Col md={6} key={q.id}>
                    <Card className="border p-3 rounded-3 shadow-sm">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="fw-bold mb-1 text-dark">{q.discipline}</h6>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <span className="level-tag mb-0">{q.level_display || q.level}</span>
                            <span className="small text-muted">{q.issuing_body}</span>
                          </div>
                          {q.certificate_number && (
                            <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                              Cert #: {q.certificate_number}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="link"
                          className="text-danger p-0"
                          onClick={() => handleDeleteQual(q.id)}
                          title="Remove qualification"
                        >
                          <Trash />
                        </Button>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Tab>

        {/* TAB 4: PROFILE SETTINGS */}
        <Tab eventKey="profile" title="Profile & Compliance">
          <Card className="glass-card border-0 p-4 shadow-sm" style={{ maxWidth: '720px' }}>
            <h5 className="fw-bold mb-3">Coach Details & Safety Compliance</h5>
            <Form onSubmit={handleUpdateProfile}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">Headline</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Senior WAG Level 3 & Trampoline Coach"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </Form.Group>

              <Row className="g-2 mb-3">
                <Col md={6}>
                  <Form.Label className="small fw-bold">City / Area</Form.Label>
                  <Form.Control
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </Col>
                <Col md={6}>
                  <Form.Label className="small fw-bold">Hourly Rate (£/hr)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.5"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                  />
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">Coaching Bio & Experience</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Describe your gymnastics coaching philosophy, years of experience, squads managed..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </Form.Group>

              <div className="p-3 bg-light rounded-3 mb-4 border">
                <h6 className="fw-bold mb-2">Safety & Child Protection Checks</h6>
                <Form.Check
                  type="switch"
                  id="dbs-switch"
                  label="I possess an Enhanced DBS (Background Check) clearance"
                  checked={dbsChecked}
                  onChange={(e) => setDbsChecked(e.target.checked)}
                  className="mb-2 fw-semibold small"
                />
                <Form.Check
                  type="switch"
                  id="safeguarding-switch"
                  label="I have completed Safeguarding & Child Protection certification"
                  checked={safeguarding}
                  onChange={(e) => setSafeguarding(e.target.checked)}
                  className="fw-semibold small"
                />
              </div>

              <Button type="submit" className="btn-primary-gradient px-4" disabled={updatingProfile}>
                {updatingProfile ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </Form>
          </Card>
        </Tab>
      </Tabs>

      {/* MODAL: ADD QUALIFICATION */}
      <Modal show={showQualModal} onHide={() => setShowQualModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-5 fw-bold">Add Coaching Qualification</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddQual}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Gymnastics Discipline</Form.Label>
              <Form.Select value={qualDiscipline} onChange={(e) => setQualDiscipline(e.target.value)}>
                <option value="Women's Artistic">Women's Artistic (WAG)</option>
                <option value="Men's Artistic">Men's Artistic (MAG)</option>
                <option value="Trampoline">Trampoline</option>
                <option value="Acrobatic Gymnastics">Acrobatic Gymnastics</option>
                <option value="Pre-School Gymnastics">Pre-School Gymnastics</option>
                <option value="Tumbling">Tumbling</option>
                <option value="General Gymnastics">General Gymnastics</option>
                <option value="First Aid in Sport">First Aid in Sport</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Coaching Level</Form.Label>
              <Form.Select value={qualLevel} onChange={(e) => setQualLevel(e.target.value)}>
                <option value="Level 1">Level 1 - Assistant Coach</option>
                <option value="Level 2">Level 2 - Lead Coach</option>
                <option value="Level 3">Level 3 - Senior Coach</option>
                <option value="Level 4">Level 4 - High Performance</option>
                <option value="Level 5">Level 5 - Master Coach</option>
                <option value="Certified">Certified</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Issuing Body</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. British Gymnastics / USA Gymnastics"
                value={qualIssuingBody}
                onChange={(e) => setQualIssuingBody(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Certificate Number (Optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. BG-109284"
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowQualModal(false)}>Cancel</Button>
            <Button type="submit" className="btn-primary-gradient" disabled={addingQual}>
              {addingQual ? 'Saving...' : 'Add Qualification'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* MODAL: ADD AVAILABILITY */}
      <Modal show={showAvailModal} onHide={() => setShowAvailModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-5 fw-bold">Add Free Weekly Time Slot</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddAvail}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Day of the Week</Form.Label>
              <Form.Select value={availDay} onChange={(e) => setAvailDay(e.target.value)}>
                {dayNames.map((d, idx) => (
                  <option key={d} value={idx}>{d}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row className="g-2 mb-3">
              <Col>
                <Form.Label className="small fw-bold">Start Time</Form.Label>
                <Form.Control
                  type="time"
                  value={availStart}
                  onChange={(e) => setAvailStart(e.target.value)}
                  required
                />
              </Col>
              <Col>
                <Form.Label className="small fw-bold">End Time</Form.Label>
                <Form.Control
                  type="time"
                  value={availEnd}
                  onChange={(e) => setAvailEnd(e.target.value)}
                  required
                />
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Notes (Optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Available for evening squads or weekends"
                value={availNotes}
                onChange={(e) => setAvailNotes(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowAvailModal(false)}>Cancel</Button>
            <Button type="submit" className="btn-primary-gradient" disabled={addingAvail}>
              {addingAvail ? 'Saving...' : 'Add Availability'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* MODAL: APPLY FOR COVER */}
      <Modal show={!!applyingCover} onHide={() => setApplyingCover(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-5 fw-bold">Apply for Cover: {applyingCover?.title}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleApplyCover}>
          <Modal.Body>
            <p className="text-secondary small mb-3">
              {applyingCover?.organization_name} • {applyingCover?.date} ({applyingCover?.start_time} - {applyingCover?.end_time})
            </p>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Pitch Note to Club</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="e.g. I am free and live nearby, happy to step in for this squad!"
                value={pitchNote}
                onChange={(e) => setPitchNote(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setApplyingCover(null)}>Cancel</Button>
            <Button type="submit" className="btn-primary-gradient" disabled={submittingApp}>
              {submittingApp ? 'Submitting...' : 'Confirm & Apply'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};
