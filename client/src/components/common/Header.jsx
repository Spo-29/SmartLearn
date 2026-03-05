import React from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';

const Header = () => {
  return (
    <>
      <Navbar expand="md" className="bg-white shadow-lg header py-3">
        <Container>
          <Navbar.Brand href="/">
            <strong>Smart Learning</strong>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbarScroll" />
          <Navbar.Collapse id="navbarScroll">
            <Nav className="me-auto my-2 my-lg-0" navbarScroll>
              <Nav.Link href="/courses" className="">
                All Courses
              </Nav.Link>
            </Nav>
            <a href="/account/my-learning" className="btn btn-primary">
              My Account
            </a>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
};

export default Header;
