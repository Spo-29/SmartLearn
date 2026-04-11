import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../common/Layout';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalSales: 0,
  });
  const [courses, setCourses] = useState([]);
  const [actionCourseId, setActionCourseId] = useState(null);

  const adminInfo = useMemo(() => {
    const raw = localStorage.getItem('userInfoLms');

    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const token = adminInfo?.token || null;

  const handleForbidden = useCallback(() => {
    localStorage.removeItem('userInfoLms');
    toast.error('Admin session expired. Please login again.');
    navigate('/account/login');
  }, [navigate]);

  const loadDashboard = useCallback(async () => {
    if (!token) {
      navigate('/account/login');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/admin/dashboard`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleForbidden();
        return;
      }

      if (result.status !== 200) {
        toast.error(result.message || 'Failed to load admin dashboard.');
        return;
      }

      setSummary({
        totalUsers: Number(result?.data?.summary?.total_users || 0),
        totalCourses: Number(result?.data?.summary?.total_courses || 0),
        totalEnrollments: Number(result?.data?.summary?.total_enrollments || 0),
        totalSales: Number(result?.data?.summary?.total_sales || 0),
      });
      
      setCourses(result?.data?.course_sales || []);
    } catch {
      toast.error('Failed to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  }, [handleForbidden, navigate, token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleToggleStatus = async (course) => {
    if (!token) {
      handleForbidden();
      return;
    }

    const nextStatus = Number(course.status) === 1 ? 0 : 1;
    setActionCourseId(course.id);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/admin/courses/${course.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleForbidden();
        return;
      }

      if (result.status !== 200) {
        toast.error(result.message || 'Failed to update course status.');
        return;
      }

      toast.success(result.message || 'Course status updated.');
      await loadDashboard();
    } catch {
      toast.error('Failed to update course status.');
    } finally {
      setActionCourseId(null);
    }
  };

  const handleDeleteCourse = async (course) => {
    if (!token) {
      handleForbidden();
      return;
    }

    const confirmed = window.confirm(`Delete course \"${course.title}\"? This action cannot be undone.`);

    if (!confirmed) {
      return;
    }

    setActionCourseId(course.id);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/admin/courses/${course.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleForbidden();
        return;
      }

      if (result.status !== 200) {
        toast.error(result.message || 'Failed to delete course.');
        return;
      }

      toast.success(result.message || 'Course deleted successfully.');
      await loadDashboard();
    } catch {
      toast.error('Failed to delete course.');
    } finally {
      setActionCourseId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfoLms');
    navigate('/account/login');
  };

  return (
    <Layout>
      <section className="section-4">
        <div className="container pb-5 pt-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/admin/dashboard">Admin</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Dashboard
              </li>
            </ol>
          </nav>

          <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
            <h2 className="h4 mb-0">Admin Dashboard</h2>
            <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>

          {loading ? (
            <div className="card border-0 shadow-lg">
              <div className="card-body p-4">Loading admin dashboard...</div>
            </div>
          ) : (
            <>
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <div className="card shadow border-0">
                    <div className="card-body p-3">
                      <h3 className="h4 mb-1">{summary.totalUsers}</h3>
                      <span>Total Users</span>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card shadow border-0">
                    <div className="card-body p-3">
                      <h3 className="h4 mb-1">{summary.totalCourses}</h3>
                      <span>Total Courses</span>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card shadow border-0">
                    <div className="card-body p-3">
                      <h3 className="h4 mb-1">{summary.totalEnrollments}</h3>
                      <span>Total Enrollments</span>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card shadow border-0">
                    <div className="card-body p-3">
                      <h3 className="h4 mb-1">${summary.totalSales.toFixed(2)}</h3>
                      <span>Total Sales</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-lg">
                <div className="card-body p-3 p-md-4">
                  <h3 className="h5 mb-3">Course Sales and Moderation</h3>

                  <div className="table-responsive">
                    <table className="table table-striped align-middle">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Course</th>
                          <th>Creator</th>
                          <th>Price</th>
                          <th>Enrollments</th>
                          <th>Sales</th>
                          <th>Reviews</th>
                          <th>Rating</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.length ? (
                          courses.map((course, index) => (
                            <tr key={course.id}>
                              <td>{index + 1}</td>
                              <td>
                                <Link to={`/detail/${course.id}`} className="text-decoration-none fw-semibold">
                                  {course.title}
                                </Link>
                              </td>
                              <td>
                                <div>{course?.creator?.name || 'Unknown'}</div>
                                <small className="text-muted">{course?.creator?.email || 'N/A'}</small>
                              </td>
                              <td>${Number(course.price || 0).toFixed(2)}</td>
                              <td>{Number(course.enrollments_count || 0)}</td>
                              <td>${Number(course.sales || 0).toFixed(2)}</td>
                              <td>{Number(course.reviews_count || 0)}</td>
                              <td>{Number(course.average_rating || 0).toFixed(1)}</td>
                              <td>
                                <span className={`badge ${Number(course.status) === 1 ? 'bg-success' : 'bg-secondary'}`}>{Number(course.status) === 1 ? 'Published' : 'Unpublished'}</span>
                              </td>
                              <td>
                                <div className="d-flex gap-2 flex-wrap">
                                  <button type="button" className={`btn btn-sm ${Number(course.status) === 1 ? 'btn-warning' : 'btn-success'}`} onClick={() => handleToggleStatus(course)} disabled={actionCourseId === course.id}>
                                    {Number(course.status) === 1 ? 'Unpublish' : 'Publish'}
                                  </button>
                                  <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteCourse(course)} disabled={actionCourseId === course.id}>
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="10" className="text-center text-muted py-4">
                              No courses found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default AdminDashboard;
