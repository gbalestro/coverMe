import React from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { ShieldCheck, CalendarCheck, People, LightningCharge, CheckCircleFill, ArrowRight } from 'react-bootstrap-icons';
import { useAuth } from '../context/AuthContext';

export const HomePage = () => {
  const { isAuthenticated, isClub, isCoach } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section className="py-5 text-center position-relative overflow-hidden">
        <Container className="py-5">
          <Badge bg="primary" className="bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 rounded-pill mb-3 fw-semibold">
            ✨ Gymnastics Coach Availability & Class Cover Platform
          </Badge>
          <h1 className="display-4 fw-extrabold mb-3 text-dark">
            Never Cancel a Gymnastics Class Again.
          </h1>
          <p className="lead text-secondary max-w-700 mx-auto mb-4" style={{ maxWidth: '720px' }}>
            <strong>coverMe</strong> eliminates scheduling headaches for gymnastics clubs. Connect with pre-vetted, Level 1–5 qualified coaches, verify DBS compliance, and resolve session covers in minutes.
          </p>

          <div className="d-flex justify-content-center gap-3 flex-wrap mb-5">
            {isAuthenticated ? (
              <Button
                as={Link}
                to={isClub ? '/club/dashboard' : '/coach/dashboard'}
                className="btn-primary-gradient px-4 py-3 fs-5"
              >
                Go to Your Dashboard <ArrowRight className="ms-2" />
              </Button>
            ) : (
              <>
                <Button as={Link} to="/register?role=ORGANIZATION" className="btn-primary-gradient px-4 py-3 fs-5">
                  Register as a Club
                </Button>
                <Button as={Link} to="/register?role=WORKER" variant="outline-custom" className="px-4 py-3 fs-5">
                  Join as a Coach
                </Button>
              </>
            )}
            <Button as={Link} to="/discover" variant="light" className="border shadow-sm px-4 py-3 fs-5">
              Explore Available Coaches
            </Button>
          </div>

          {/* Quick Demo Login Pill */}
          {!isAuthenticated && (
            <div className="d-inline-flex align-items-center gap-2 bg-white border rounded-pill px-4 py-2 shadow-sm">
              <span className="small text-muted">Quick Presentation Demo:</span>
              <Link to="/login" className="btn btn-sm btn-outline-primary rounded-pill py-0 px-2 fw-semibold">
                Test Accounts Demo
              </Link>
            </div>
          )}
        </Container>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold">Built for Strict Gymnastics Standards</h2>
            <p className="text-muted">Designed for high compliance, safety, and rapid coordination.</p>
          </div>

          <Row className="g-4">
            <Col md={4}>
              <Card className="glass-card h-100 p-4 border-0">
                <div className="d-inline-flex p-3 rounded-circle bg-primary bg-opacity-10 text-primary mb-3" style={{ width: 'fit-content' }}>
                  <ShieldCheck size={32} />
                </div>
                <h4 className="fw-bold mb-2">Club Vetting & Roster Control</h4>
                <p className="text-secondary small">
                  Child protection comes first. Clubs curate and approve their own roster pool. Coaches can <strong>only</strong> accept covers for clubs where their DBS and qualifications have been vetted.
                </p>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="glass-card h-100 p-4 border-0">
                <div className="d-inline-flex p-3 rounded-circle bg-success bg-opacity-10 text-success mb-3" style={{ width: 'fit-content' }}>
                  <CalendarCheck size={32} />
                </div>
                <h4 className="fw-bold mb-2">Live Availability & Slots</h4>
                <p className="text-secondary small">
                  Coaches publish recurring weekly free hours or specific dates. Clubs filter by exact day, discipline (WAG, MAG, Trampoline, Acro), and minimum qualification level (Level 1–5).
                </p>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="glass-card h-100 p-4 border-0">
                <div className="d-inline-flex p-3 rounded-circle bg-info bg-opacity-10 text-info mb-3" style={{ width: 'fit-content' }}>
                  <LightningCharge size={32} />
                </div>
                <h4 className="fw-bold mb-2">1-Click Cover Matching</h4>
                <p className="text-secondary small">
                  When a coach is sick or traveling, post the squad cover in 60 seconds. Pre-approved coaches are notified and can accept directly from their mobile device.
                </p>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Scalability Future Pitch */}
      <section className="py-5 bg-white border-top border-bottom">
        <Container className="py-4">
          <Row className="align-items-center">
            <Col lg={7}>
              <Badge bg="warning" className="text-dark mb-2 fw-semibold">Scalable Platform Architecture</Badge>
              <h3 className="fw-bold mb-3">Expanding from Gymnastics to All Sports & Companies</h3>
              <p className="text-secondary">
                While tailored for gymnastics compliance today, <strong>coverMe</strong>'s underlying core domain is built for multi-tenant enterprise shift and cover management across swimming, martial arts, tennis, and corporate teams.
              </p>
              <ul className="list-unstyled text-secondary">
                <li className="mb-2 d-flex align-items-center gap-2">
                  <CheckCircleFill className="text-success" /> Phase 1: Gymnastics Clubs & Coaches (Live MVP)
                </li>
                <li className="mb-2 d-flex align-items-center gap-2">
                  <CheckCircleFill className="text-primary" /> Phase 2: Multi-Sports Federation expansion
                </li>
                <li className="mb-2 d-flex align-items-center gap-2">
                  <CheckCircleFill className="text-info" /> Phase 3: Universal Corporate Shift Cover Engine
                </li>
              </ul>
            </Col>
            <Col lg={5} className="text-center text-lg-end">
              <Button as={Link} to="/discover" className="btn-primary-gradient px-4 py-3 fs-5">
                Try the Live Discovery Tool
              </Button>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};
