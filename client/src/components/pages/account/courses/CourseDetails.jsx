import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../../common/Layout';
import { Accordion } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import UserSidebar from '../../../common/UserSidebar';
import toast from 'react-hot-toast';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [meta, setMeta] = useState({
    categories: [],
    levels: [],
    languages: [],
  });
  const [outcomes, setOutcomes] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [chapters, setChapters] = useState([]);

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

  const categoryName = useMemo(() => {
    return meta.categories.find((item) => Number(item.id) === Number(course?.category_id))?.name || 'N/A';
  }, [course?.category_id, meta.categories]);

  const levelName = useMemo(() => {
    return meta.levels.find((item) => Number(item.id) === Number(course?.level_id))?.name || 'N/A';
  }, [course?.level_id, meta.levels]);

  const languageName = useMemo(() => {
    return meta.languages.find((item) => Number(item.id) === Number(course?.language_id))?.name || 'N/A';
  }, [course?.language_id, meta.languages]);

  useEffect(() => {
    if (!token) {
      toast.error('Please login first.');
      navigate('/account/login');
      return;
    }

    const loadCourseDetails = async () => {
      setLoading(true);

      try {
        const [metaResponse, courseResponse, outcomesResponse, requirementsResponse, chaptersResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/meta`, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/${id}/edit`, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/${id}/outcomes`, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/${id}/requirements`, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/${id}/chapters`, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const metaResult = await metaResponse.json();
        const courseResult = await courseResponse.json();
        const outcomesResult = await outcomesResponse.json();
        const requirementsResult = await requirementsResponse.json();
        const chaptersResult = await chaptersResponse.json();

        if (metaResult.status !== 200 || courseResult.status !== 200) {
          toast.error(courseResult.message || 'Failed to load course details.');
          navigate('/account/my-courses');
          return;
        }

        setMeta({
          categories: metaResult.categories || [],
          levels: metaResult.levels || [],
          languages: metaResult.languages || [],
        });
        setCourse(courseResult.data || null);
        setOutcomes(outcomesResult.status === 200 ? outcomesResult.data || [] : []);
        setRequirements(requirementsResult.status === 200 ? requirementsResult.data || [] : []);
        setChapters(chaptersResult.status === 200 ? chaptersResult.data || [] : []);
      } catch {
        toast.error('Failed to load course details.');
      } finally {
        setLoading(false);
      }
    };

    loadCourseDetails();
  }, [id, navigate, token]);

  return (
    <Layout>
      <section className="section-4">
        <div className="container pb-5 pt-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/account/dashboard">Account</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/account/my-courses">My Courses</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Course Details
              </li>
            </ol>
          </nav>

          <div className="row">
            <div className="col-md-12 mt-5 mb-3">
              <div className="d-flex justify-content-between align-items-center gap-2">
                <h2 className="h4 mb-0 pb-0">Course Details</h2>
                <div className="d-flex align-items-center gap-2">
                  <button type="button" className="btn btn-primary" onClick={() => navigate(`/account/courses/edit/${id}`)}>
                    Edit Course
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => navigate('/account/my-courses')}>
                    Back
                  </button>
                </div>
              </div>
            </div>

            <div className="col-lg-3 account-sidebar">
              <UserSidebar />
            </div>

            <div className="col-lg-9">
              {loading ? (
                <div className="card border-0 shadow-lg">
                  <div className="card-body p-4">
                    <p className="mb-0">Loading course details...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="card border-0 shadow-lg mb-3">
                    <div className="card-body p-4">
                      <h3 className="h5">Basic Information</h3>
                      <hr />
                      <div className="row g-3">
                        <div className="col-md-12">
                          <p className="mb-1 small text-muted">Title</p>
                          <p className="mb-0 fw-semibold">{course?.title || 'N/A'}</p>
                        </div>
                        <div className="col-md-4">
                          <p className="mb-1 small text-muted">Category</p>
                          <p className="mb-0">{categoryName}</p>
                        </div>
                        <div className="col-md-4">
                          <p className="mb-1 small text-muted">Level</p>
                          <p className="mb-0">{levelName}</p>
                        </div>
                        <div className="col-md-4">
                          <p className="mb-1 small text-muted">Language</p>
                          <p className="mb-0">{languageName}</p>
                        </div>
                        <div className="col-md-4">
                          <p className="mb-1 small text-muted">Price</p>
                          <p className="mb-0">{course?.price ?? 'N/A'}</p>
                        </div>
                        <div className="col-md-4">
                          <p className="mb-1 small text-muted">Cross Price</p>
                          <p className="mb-0">{course?.cross_price ?? 'N/A'}</p>
                        </div>
                        <div className="col-md-4">
                          <p className="mb-1 small text-muted">Status</p>
                          <p className="mb-0">{Number(course?.status) === 1 ? 'Published' : 'Unpublished'}</p>
                        </div>
                        <div className="col-md-12">
                          <p className="mb-1 small text-muted">Description</p>
                          <p className="mb-0">{course?.description || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card border-0 shadow-lg mb-3">
                    <div className="card-body p-4">
                      <h3 className="h5">What You Will Learn</h3>
                      <hr />
                      {outcomes.length ? (
                        <ul className="mb-0">
                          {outcomes.map((item) => (
                            <li key={item.id} className="mb-1">{item.text}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mb-0 text-muted">No outcomes added yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="card border-0 shadow-lg mb-3">
                    <div className="card-body p-4">
                      <h3 className="h5">Requirements</h3>
                      <hr />
                      {requirements.length ? (
                        <ul className="mb-0">
                          {requirements.map((item) => (
                            <li key={item.id} className="mb-1">{item.text}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mb-0 text-muted">No requirements added yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="card border-0 shadow-lg">
                    <div className="card-body p-4">
                      <h3 className="h5">Chapters & Lessons</h3>
                      <hr />

                      {chapters.length ? (
                        <Accordion>
                          {chapters.map((chapter) => (
                            <Accordion.Item eventKey={String(chapter.id)} key={chapter.id}>
                              <Accordion.Header>{chapter.title}</Accordion.Header>
                              <Accordion.Body>
                                {(chapter.lessons || []).length ? (
                                  <ul className="mb-0">
                                    {(chapter.lessons || []).map((lesson) => (
                                      <li key={lesson.id} className="mb-1">{lesson.title}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="mb-0 text-muted">No lessons in this chapter.</p>
                                )}
                              </Accordion.Body>
                            </Accordion.Item>
                          ))}
                        </Accordion>
                      ) : (
                        <p className="mb-0 text-muted">No chapters added yet.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CourseDetails;
