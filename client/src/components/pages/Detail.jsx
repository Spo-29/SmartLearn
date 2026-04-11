import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Accordion, Card, ListGroup } from 'react-bootstrap';
import toast from 'react-hot-toast';
import Layout from '../common/Layout';

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

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
    if (!id) {
      setCourse(null);
      setLoading(false);
      return;
    }

    const fetchCourse = async () => {
      setLoading(true);

      try {
        const headers = {
          Accept: 'application/json',
        };

        const endpoint = token ? `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/${id}/detail` : `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/fetch-course/${id}`;

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(endpoint, { headers });

        const result = await response.json();

        if (result.status === 200) {
          const nextCourse = result.data || null;

          if (nextCourse) {
            nextCourse.is_owner = Boolean(nextCourse.is_owner);
            nextCourse.is_enrolled = Boolean(nextCourse.is_enrolled);
            nextCourse.reviews = Array.isArray(nextCourse.reviews) ? nextCourse.reviews : [];
            nextCourse.average_rating = Number(nextCourse.average_rating || 0);
            nextCourse.reviews_count = Number(nextCourse.reviews_count || nextCourse.reviews.length || 0);
          }

          setCourse(nextCourse);
        } else {
          setCourse(null);
          toast.error(result.message || 'Failed to load course details.');
        }
      } catch {
        setCourse(null);
        toast.error('Failed to load course details.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, token]);

  const handleEnroll = async () => {
    if (!id) {
      return;
    }

    if (!token) {
      toast.error('Please login first.');
      navigate('/account/login');
      return;
    }

    setEnrolling(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/${id}/enroll`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.status === 200) {
        if (result?.message === 'you have enrolled already') {
          toast.error('you have enrolled already');
        } else {
          toast.success(result.message || 'Enrolled successfully.');
        }

        if (result.data) {
          setCourse(result.data);
        }
        return;
      }

      toast.error(result.message || 'Failed to enroll in this course.');
    } catch {
      toast.error('Failed to enroll in this course.');
    } finally {
      setEnrolling(false);
    }
  };

  const renderStars = (ratingValue) => {
    const rating = Math.max(0, Math.min(5, Number(ratingValue || 0)));
    const fullStars = Math.round(rating);

    return Array.from({ length: 5 }).map((_, index) => (
      <span key={index} className={index < fullStars ? 'text-warning' : 'text-secondary'}>
        ★
      </span>
    ));
  };

  const totalChapters = Number(course?.chapters_count || 0);
  const totalLessons = Number(course?.lessons_count || 0);
  const averageRating = Number(course?.average_rating || 0);
  const reviews = course?.reviews || [];

  return (
    <Layout>
      <div className="container pb-5 pt-3">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/home">Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link to="/courses">Courses</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {course?.title || 'Course Details'}
            </li>
          </ol>
        </nav>

        {loading ? (
          <div className="border bg-white rounded-3 p-4 mt-4">
            <p className="mb-0">Loading course details...</p>
          </div>
        ) : !course ? (
          <div className="border bg-white rounded-3 p-4 mt-4">
            <h2 className="h4">Course not found</h2>
            <p className="mb-0 text-muted">The selected course is unavailable right now.</p>
          </div>
        ) : (
          <div className="row my-5">
            <div className="col-lg-8">
              <h2>{course.title}</h2>
              <div className="d-flex gap-3 flex-wrap mt-3">
                <span className="badge bg-green">{course.category?.name || 'Category N/A'}</span>
                <span className="text-muted">Level: {course.level?.name || 'N/A'}</span>
                <span className="text-muted">Language: {course.language?.name || 'N/A'}</span>
              </div>

              <div className="row mt-4">
                <div className="col-md-6">
                  <span className="text-muted d-block">Total Chapters</span>
                  <span className="fw-bold">{totalChapters}</span>
                </div>
                <div className="col-md-6">
                  <span className="text-muted d-block">Total Lessons</span>
                  <span className="fw-bold">{totalLessons}</span>
                </div>
              </div>

              <div className="mt-3 d-flex align-items-center gap-2">
                <span className="fw-semibold">{averageRating.toFixed(1)}</span>
                <span>{renderStars(averageRating)}</span>
                <span className="text-muted">({Number(course?.reviews_count || 0)} reviews)</span>
              </div>

              <div className="row">
                <div className="col-md-12 mt-4">
                  <div className="border bg-white rounded-3 p-4">
                    <h3 className="mb-3  h4">Overview</h3>
                    <p className="mb-0">{course.description || 'No description available.'}</p>
                  </div>
                </div>

                <div className="col-md-12 mt-4">
                  <div className="border bg-white rounded-3 p-4">
                    <h3 className="mb-3 h4">What You Will Learn</h3>
                    {(course.outcomes || []).length ? (
                      <ul className="list-unstyled mt-3 mb-0">
                        {(course.outcomes || []).map((outcome) => (
                          <li className="d-flex align-items-center mb-2" key={outcome.id}>
                            <span className="text-success me-2">&#10003;</span>
                            <span>{outcome.text}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mb-0 text-muted">No outcomes added yet.</p>
                    )}
                  </div>
                </div>

                <div className="col-md-12 mt-4">
                  <div className="border bg-white rounded-3 p-4">
                    <h3 className="mb-3 h4">Requirements</h3>
                    {(course.requirements || []).length ? (
                      <ul className="list-unstyled mt-3 mb-0">
                        {(course.requirements || []).map((requirement) => (
                          <li className="d-flex align-items-center mb-2" key={requirement.id}>
                            <span className="text-success me-2">&#10003;</span>
                            <span>{requirement.text}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mb-0 text-muted">No requirements added yet.</p>
                    )}
                  </div>
                </div>

                <div className="col-md-12 mt-4">
                  <div className="border bg-white rounded-3 p-4">
                    <h3 className="h4 mb-3">Course Structure</h3>
                    {(course.chapters || []).length ? (
                      <Accordion>
                        {(course.chapters || []).map((chapter) => (
                          <Accordion.Item eventKey={String(chapter.id)} key={chapter.id}>
                            <Accordion.Header>
                              {chapter.title}
                              <span className="ms-2 text-muted">({(chapter.lessons || []).length} lessons)</span>
                            </Accordion.Header>
                            <Accordion.Body>
                              {(chapter.lessons || []).length ? (
                                <ListGroup>
                                  {(chapter.lessons || []).map((lesson) => (
                                    <ListGroup.Item as={Link} action key={lesson.id} to={`/detail/${id}/lessons/${lesson.id}`} state={{ from: `/detail/${id}` }}>
                                      {lesson.title}
                                    </ListGroup.Item>
                                  ))}
                                </ListGroup>
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

                <div className="col-md-12 mt-4">
                  <div className="border bg-white rounded-3 p-4">
                    <h3 className="h4 mb-3">Reviews & Ratings</h3>

                    {reviews.length ? (
                      <div className="d-flex flex-column gap-3">
                        {reviews.map((review) => (
                          <div className="border rounded-3 p-3" key={review.id}>
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                              <div className="fw-semibold">{review?.user?.name || 'Anonymous User'}</div>
                              <div className="d-flex align-items-center gap-2">
                                <span>{renderStars(review.rating)}</span>
                                <span className="small text-muted">{Number(review.rating || 0).toFixed(1)}</span>
                              </div>
                            </div>
                            <p className="mb-0 mt-2">{review.comment || 'No comment provided.'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mb-0 text-muted">No reviews yet. Enrolled learners can add the first review from the watch page.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="border rounded-3 bg-white p-4 shadow-sm">
                <Card.Body>
                  <h3 className="fw-bold">${course.price !== null && course.price !== undefined ? Number(course.price).toFixed(2) : '0.00'}</h3>
                  {course.cross_price !== null && course.cross_price !== undefined ? <div className="text-muted text-decoration-line-through">${Number(course.cross_price).toFixed(2)}</div> : null}
                </Card.Body>

                <div className="d-grid mt-3 gap-2">
                  {course?.is_owner ? (
                    <button type="button" className="btn btn-secondary" disabled>
                      You created this course
                    </button>
                  ) : course?.is_enrolled ? (
                    <>
                      <button type="button" className="btn btn-secondary" disabled>
                        Enrolled
                      </button>
                      <Link to={`/account/watch-course/${course.id}`} className="btn btn-primary">
                        Watch Now
                      </Link>
                    </>
                  ) : (
                    <button type="button" className="btn btn-primary" onClick={handleEnroll} disabled={enrolling}>
                      {enrolling ? 'Enrolling...' : 'Enroll'}
                    </button>
                  )}
                </div>

                <Card.Footer className="mt-4">
                  <h6 className="fw-bold">This course includes</h6>
                  <ListGroup variant="flush">
                    <ListGroup.Item className="ps-0">{totalChapters} chapters</ListGroup.Item>
                    <ListGroup.Item className="ps-0">{totalLessons} lessons</ListGroup.Item>
                  </ListGroup>
                </Card.Footer>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Detail;
