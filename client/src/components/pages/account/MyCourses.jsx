import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../../common/Layout';
import UserSidebar from '../../common/UserSidebar';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const MyCourses = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const activeOnly = searchParams.get('active') === '1';

  const token = useMemo(() => {
    const rawUserInfo = localStorage.getItem('userInfoLms');

    if (!rawUserInfo) {
      return null;
    }

    try {
      return JSON.parse(rawUserInfo)?.token || null;
    } catch (error) {
      return null;
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/my-courses`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.status === 200) {
        setCourses(result.data || []);
      } else {
        toast.error(result.message || 'Failed to load courses.');
      }
    } catch {
      toast.error('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleDeleteCourse = async (courseId) => {
    setDeletingId(courseId);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.status === 200) {
        setCourses((prev) => prev.filter((course) => course.id !== courseId));
        toast.success(result.message || 'Course deleted successfully.');
      } else {
        toast.error(result.message || 'Failed to delete course.');
      }
    } catch {
      toast.error('Failed to delete course.');
    } finally {
      setDeletingId(null);
    }
  };

  const displayedCourses = useMemo(() => {
    if (!activeOnly) {
      return courses;
    }

    return courses.filter((course) => Number(course.status) === 1);
  }, [activeOnly, courses]);

  return (
    <Layout>
      <section className="section-4">
        <div className="container pb-5 pt-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/account/dashboard">Account</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {activeOnly ? 'Active Courses' : 'My Courses'}
              </li>
            </ol>
          </nav>

          <div className="row">
            <div className="col-md-12 mt-5 mb-3">
              <div className="d-flex justify-content-between">
                <h2 className="h4 mb-0 pb-0">{activeOnly ? 'Active Courses' : 'My Courses'}</h2>
                {activeOnly ? (
                  <Link to="/account/my-courses" className="btn btn-secondary">
                    All Courses
                  </Link>
                ) : (
                  <Link to="/account/my-courses/create" className="btn btn-primary">
                    Create
                  </Link>
                )}
              </div>
            </div>
            <div className="col-lg-3 account-sidebar">
              <UserSidebar />
            </div>
            <div className="col-lg-9">
              {loading ? (
                <div className="card border-0 shadow-lg">
                  <div className="card-body p-4">
                    <p className="mb-0">Loading courses...</p>
                  </div>
                </div>
              ) : displayedCourses.length === 0 ? (
                <div className="card border-0 shadow-lg">
                  <div className="card-body p-4">
                    <p className="mb-0 text-muted">
                      {activeOnly ? 'No active courses found.' : 'You have not created any course yet.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="row gy-4">
                  {displayedCourses.map((course) => (
                    <div className="col-md-6 col-xl-4" key={course.id}>
                      <div className="card border-0 shadow h-100">
                        <button
                          type="button"
                          className="position-relative w-100 p-0 border-0 bg-transparent text-start"
                          onClick={() => navigate(`/account/courses/${course.id}`)}
                        >
                          <img
                            src={course.course_small_image || 'https://placehold.co/600x350?text=Course'}
                            alt={course.title}
                            className="img-fluid w-100"
                            style={{ height: '190px', objectFit: 'cover' }}
                          />
                          <span
                            className={`badge position-absolute top-0 end-0 m-2 ${Number(course.status) === 1 ? 'bg-success' : 'bg-secondary'}`}
                          >
                            {Number(course.status) === 1 ? 'Published' : 'Unpublished'}
                          </span>
                        </button>
                        <div className="card-body">
                          <button
                            type="button"
                            className="btn btn-link p-0 mb-2 fw-semibold text-start text-decoration-none"
                            onClick={() => navigate(`/account/courses/${course.id}`)}
                          >
                            {course.title}
                          </button>
                          <p className="small text-muted mb-0">
                            {course.level?.name || 'Level N/A'}
                          </p>
                        </div>
                        {activeOnly ? (
                          <div className="card-footer bg-white d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => navigate(`/account/courses/${course.id}`)}
                            >
                              View Details
                            </button>
                          </div>
                        ) : (
                          <div className="card-footer bg-white d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => navigate(`/account/courses/edit/${course.id}`)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteCourse(course.id)}
                              disabled={deletingId === course.id}
                            >
                              {deletingId === course.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
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

export default MyCourses;
