import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../common/Layout';
import UserSidebar from '../../common/UserSidebar';
import CourseEnrolled from '../../common/CourseEnrolled';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

 const MyLearning = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

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
      toast.error('Please login first.');
      navigate('/account/login');
      return;
    }

    const fetchEnrollments = async () => {
      setLoading(true);

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/my-enrollments`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (result.status === 200) {
          setCourses(result.data || []);
          return;
        }

        toast.error(result.message || 'Failed to load enrollments.');
        setCourses([]);
      } catch {
        toast.error('Failed to load enrollments.');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [navigate, token]);

  return (
    <Layout>
      <section className="section-4">
        <div className="container">
          <nav aria-label="breadcrumb" className="pt-3">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/account/dashboard">Account</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                My Learning
              </li>
            </ol>
          </nav>
          <div className="row">
            <div className="d-flex justify-content-between  mt-5 mb-3">
              <h2 className="h4 mb-0 pb-0">My Learning</h2>
            </div>
            <div className="col-lg-3 account-sidebar">
              <UserSidebar />
            </div>

            <div className="col-lg-9">
              {loading ? (
                <div className="card border-0 shadow-lg">
                  <div className="card-body p-4">
                    <p className="mb-0">Loading your enrollments...</p>
                  </div>
                </div>
              ) : courses.length === 0 ? (
                <div className="card border-0 shadow-lg">
                  <div className="card-body p-4">
                    <p className="mb-0 text-muted">You have not enrolled in any course yet.</p>
                  </div>
                </div>
              ) : (
                <div className="row gy-4">
                  {courses.map((course) => (
                    <CourseEnrolled key={course.id} course={course} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default MyLearning;
