import React from 'react';
import { Navbar, Nav, Container, Button, Dropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, PersonCircle, BoxArrowRight, PlusCircle, Search, CalendarCheck } from 'react-bootstrap-icons';

export const AppNavbar = () => {
  const { user, isAuthenticated, isClub, isCoach, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar expand="lg" className="glass-nav sticky-top py-3">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
          <span className="brand-gradient fs-3 fw-bold">coverMe</span>
          <Badge bg="primary" className="bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2 py-1 fw-semibold small">
            Gymnastics Edition
          </Badge>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar-nav" />
        <Navbar.Collapse id="main-navbar-nav">
          <Nav className="me-auto ms-lg-4 gap-lg-2">
            <Nav.Link as={Link} to="/discover" className="d-flex align-items-center gap-1 text-secondary fw-semibold">
              <Search size={15} /> Find Coaches
            </Nav.Link>
            <Nav.Link as={Link} to="/covers" className="d-flex align-items-center gap-1 text-secondary fw-semibold">
              <CalendarCheck size={15} /> Open Covers
            </Nav.Link>

            {isClub && (
              <>
                <Nav.Link as={Link} to="/club/dashboard" className="text-primary fw-bold">
                  Club Management & Roster
                </Nav.Link>
              </>
            )}

            {isCoach && (
              <>
                <Nav.Link as={Link} to="/coach/dashboard" className="text-primary fw-bold">
                  Coach Dashboard & Schedule
                </Nav.Link>
              </>
            )}
          </Nav>

          <Nav className="align-items-center gap-3 mt-3 mt-lg-0">
            {isAuthenticated ? (
              <Dropdown align="end">
                <Dropdown.Toggle variant="light" className="d-flex align-items-center gap-2 border rounded-pill px-3 py-1 shadow-sm">
                  <PersonCircle size={18} className="text-primary" />
                  <span className="fw-semibold small">{user?.display_name || user?.email}</span>
                  <Badge bg={isClub ? 'info' : 'success'} className="ms-1 small">
                    {isClub ? 'Club Admin' : 'Coach'}
                  </Badge>
                </Dropdown.Toggle>

                <Dropdown.Menu className="shadow-lg border-0 rounded-3 mt-2 p-2">
                  <div className="px-3 py-2 border-bottom mb-2">
                    <p className="mb-0 fw-bold">{user?.display_name}</p>
                    <small className="text-muted">{user?.email}</small>
                  </div>
                  {isClub ? (
                    <Dropdown.Item as={Link} to="/club/dashboard">
                      Club Roster & Settings
                    </Dropdown.Item>
                  ) : (
                    <Dropdown.Item as={Link} to="/coach/dashboard">
                      My Profile & Qualifications
                    </Dropdown.Item>
                  )}
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout} className="text-danger d-flex align-items-center gap-2">
                    <BoxArrowRight /> Log Out
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Button as={Link} to="/login" variant="outline-custom" size="sm">
                  Log In
                </Button>
                <Button as={Link} to="/register" className="btn-primary-gradient" size="sm">
                  Get Started
                </Button>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
