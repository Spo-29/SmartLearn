import React, { useContext } from 'react'
import { FaChartBar, FaDesktop, FaUserLock } from 'react-icons/fa';
import { BsMortarboardFill } from 'react-icons/bs';
import { MdLogout } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/Auth';
const UserSidebar = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/account/login');
  };

  return (
    <div className="card border-0 shadow-lg">
      <div className="card-body  p-4">
        <ul>
          <li className="d-flex align-items-center">
            <Link to="/account/dashboard">
              <FaChartBar size={16} className="me-2 " /> Dashboard
            </Link>
          </li>

          <li className="d-flex align-items-center">
            <Link to="/account/profile">
              <FaUserLock size={16} className="me-2" /> My Account
            </Link>
          </li>

          <li className="d-flex align-items-center">
            <Link to="/account/my-learning">
              <BsMortarboardFill size={16} className="me-2" /> My Enrollments
            </Link>
          </li>
          <li className="d-flex align-items-center">
            <Link to="/account/my-courses">
              <FaDesktop size={16} className="me-2" /> My Courses
            </Link>
          </li>
          <li className="d-flex align-items-center ">
            <Link to="/account/change-password">
              <FaUserLock size={16} className="me-2" /> Change Password
            </Link>
          </li>
          <li>
            <a onClick={handleLogout} className="text-danger" style={{cursor: 'pointer'}}>
              <MdLogout size={16} className="me-2" /> Logout
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default UserSidebar