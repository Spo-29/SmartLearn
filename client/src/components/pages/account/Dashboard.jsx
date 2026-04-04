import React, { useEffect, useMemo, useState } from 'react'
import Layout from '../../common/Layout';
import { Link } from 'react-router-dom';
import UserSidebar from '../../common/UserSidebar';
const Dashboard = () => {
  const [activeCourses, setActiveCourses] = useState(0);

  const token = useMemo(() => {
    const rawUserInfo = localStorage.getItem('userInfoLms');

    if (!rawUserInfo) {
      return null;
    }

    try {
      return JSON.parse(rawUserInfo)?.token || null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadCourseStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/my-courses`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (result.status === 200) {
          const courses = result.data || [];
          setActiveCourses(courses.filter((course) => Number(course.status) === 1).length);
        }
      } catch {
        setActiveCourses(0);
      }
    };

    loadCourseStats();
  }, [token]);

  return (
    <Layout>
      <section className="section-4">
        <div className="container pb-5 pt-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/account/profile">Account</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Dashboard
              </li>
            </ol>
          </nav>
          <div className="row">
            <div className="col-md-12 mt-5 mb-3">
              <div className="d-flex justify-content-between">
                <h2 className="h4 mb-0 pb-0">Dashboard</h2>
              </div>
            </div>
            <div className="col-lg-3 account-sidebar">
              <UserSidebar />
            </div>
            <div className="col-lg-9">
              <div className="row">
                <div className="col-md-4">
                  <div className="card shadow ">
                    <div className="card-body p-3">
                      <h2>0</h2>
                      <span>Sales</span>
                    </div>
                    <div className="card-footer">
                      &nbsp;
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card shadow ">
                    <div className="card-body p-3">
                      <h2>0</h2>
                      <span>Enrolled Users</span>
                    </div>
                    <div className="card-footer">&nbsp;</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card shadow ">
                    <div className="card-body p-3">
                      <h2>{activeCourses}</h2>
                      <span>Active Courses</span>
                    </div>
                    <div className="card-footer">
                      <Link to="/account/my-courses?active=1">View Courses</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export default Dashboard
