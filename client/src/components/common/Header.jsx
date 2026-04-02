import React, { useMemo } from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/account/login' || location.pathname === '/account/register';

  const landingPath = useMemo(() => {
    if (isAuthPage) {
      return '/account/login';
    }

    const rawUserInfo = localStorage.getItem('userInfoLms');

    if (!rawUserInfo) {
      return '/account/login';
    }

    try {
      const token = JSON.parse(rawUserInfo)?.token;
      return token ? '/home' : '/account/login';
    } catch {
      return '/account/login';
    }
  }, [isAuthPage]);

  const coursesPath = useMemo(() => {
    if (isAuthPage) {
      return '/account/login';
    }

    const rawUserInfo = localStorage.getItem('userInfoLms');

    if (!rawUserInfo) {
      return '/account/login';
    }

    try {
      const token = JSON.parse(rawUserInfo)?.token;
      return token ? '/courses' : '/account/login';
    } catch {
      return '/account/login';
    }
  }, [isAuthPage]);

  const myAccountPath = useMemo(() => {
    const rawUserInfo = localStorage.getItem('userInfoLms');

    if (!rawUserInfo) {
      return '/account/login';
    }

    try {
      const token = JSON.parse(rawUserInfo)?.token;
      return token ? '/account/profile' : '/account/login';
    } catch {
      return '/account/login';
    }
  }, []);

  return (
    <>
      <Navbar expand="md" className="bg-white shadow-lg header py-3">
        <Container>
          <Navbar.Brand as={Link} to={landingPath}>
            <strong>Smart Learning</strong>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbarScroll" />
          <Navbar.Collapse id="navbarScroll">
            <Nav className="me-auto my-2 my-lg-0" navbarScroll>
              <Nav.Link as={Link} to={coursesPath} className="">
                All Courses
              </Nav.Link>
            </Nav>
            <Link to={myAccountPath} className="btn btn-primary">
              My Account
            </Link>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
};

export default Header;
