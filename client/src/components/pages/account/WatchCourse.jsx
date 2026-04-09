import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Layout from '../../common/Layout';
import Accordion from 'react-bootstrap/Accordion';
import { MdSlowMotionVideo } from 'react-icons/md';
import toast from 'react-hot-toast';

const WatchCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: '',
    comment: '',
  });

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

  const allLessons = useMemo(() => {
    if (!course?.chapters?.length) {
      return [];
    }

    return course.chapters.flatMap((chapter) => chapter.lessons || []);
  }, [course]);

  const selectedLesson = useMemo(() => {
    if (!allLessons.length) {
      return null;
    }

    return allLessons.find((lesson) => lesson.id === selectedLessonId) || allLessons[0];
  }, [allLessons, selectedLessonId]);

  const selectedLessonVideoUrl = useMemo(() => {
    const video = selectedLesson?.video;
    if (!video) {
      return null;
    }

    if (/^https?:\/\//i.test(video)) {
      return video;
    }

    return `${import.meta.env.VITE_BACKEND_ENDPOINT}/${String(video).replace(/^\//, '')}`;
  }, [selectedLesson]);

  const loadCourse = useCallback(async () => {
    if (!token) {
      toast.error('Please login first.');
      navigate('/account/login');
      return;
    }

    if (!courseId) {
      toast.error('Invalid course.');
      navigate('/account/my-learning');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/my-enrollments/${courseId}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.status !== 200) {
        toast.error(result.message || 'Failed to load course details.');
        navigate('/account/my-learning');
        return;
      }

      const nextCourse = result.data || null;
      setCourse(nextCourse);

      const firstLessonId = nextCourse?.chapters?.flatMap((chapter) => chapter.lessons || [])[0]?.id || null;
      setSelectedLessonId((prev) => prev || firstLessonId);

      setReviewForm({
        rating: nextCourse?.user_review?.rating ? String(nextCourse.user_review.rating) : '',
        comment: nextCourse?.user_review?.comment || '',
      });
    } catch {
      toast.error('Failed to load course details.');
      navigate('/account/my-learning');
    } finally {
      setLoading(false);
    }
  }, [courseId, navigate, token]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!reviewForm.rating) {
      toast.error('Please select a rating between 1 and 5.');
      return;
    }

    setSubmittingReview(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/${courseId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment,
        }),
      });

      const result = await response.json();

      if (result.status === 200) {
        toast.success(result.message || 'Review submitted successfully.');
        await loadCourse();
        return;
      }

      if (result.errors) {
        const firstError = Object.values(result.errors)[0]?.[0];
        toast.error(firstError || result.message || 'Failed to submit review.');
        return;
      }

      toast.error(result.message || 'Failed to submit review.');
    } catch {
      toast.error('Failed to submit review.');
    } finally {
      setSubmittingReview(false);
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

  return (
    <Layout>
      <section className="section-5 my-5">
        <div className="container">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/account/dashboard">Account</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/account/my-learning">My Learning</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Watch Course
              </li>
            </ol>
          </nav>

          {loading ? (
            <div className="card border-0 shadow-lg">
              <div className="card-body p-4">
                <p className="mb-0">Loading enrolled course...</p>
              </div>
            </div>
          ) : !course ? (
            <div className="card border-0 shadow-lg">
              <div className="card-body p-4">
                <p className="mb-0 text-muted">Course not found.</p>
              </div>
            </div>
          ) : (
          <div className="row">
            <div className="col-md-8">
              <div className="video border rounded-3 bg-white p-2">
                {selectedLessonVideoUrl ? (
                  <video width="100%" height="500" controls key={selectedLesson?.id || 'video'}>
                    <source src={selectedLessonVideoUrl} />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 280 }}>
                    <p className="mb-0 text-muted">No lesson video added yet for this lesson.</p>
                  </div>
                )}
              </div>
              <div className="meta-content">
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3 pt-1">
                  <h3 className="pt-2">{selectedLesson?.title || course.title}</h3>
                  <div>
                    <span className="small text-muted">{course.level?.name || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <p>{selectedLesson?.description || 'No lesson description available.'}</p>
                </div>
              </div>

              <div className="border bg-white rounded-3 p-4 mt-4">
                <h3 className="h5 mb-3">Course Overview</h3>
                <p className="mb-3">{course.description || 'No course description available.'}</p>

                <h4 className="h6 mb-2">What You Will Learn</h4>
                {(course.outcomes || []).length ? (
                  <ul className="mb-3">
                    {(course.outcomes || []).map((outcome) => (
                      <li key={outcome.id}>{outcome.text}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No outcomes added yet.</p>
                )}

                <h4 className="h6 mb-2">Requirements</h4>
                {(course.requirements || []).length ? (
                  <ul className="mb-0">
                    {(course.requirements || []).map((requirement) => (
                      <li key={requirement.id}>{requirement.text}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted mb-0">No requirements added yet.</p>
                )}
              </div>

              <div className="border bg-white rounded-3 p-4 mt-4">
                <h3 className="h5 mb-3">Rate & Review This Course</h3>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="fw-semibold">{Number(course.average_rating || 0).toFixed(1)}</span>
                  <span>{renderStars(course.average_rating)}</span>
                  <span className="text-muted">({Number(course.reviews_count || 0)} reviews)</span>
                </div>

                <form onSubmit={handleReviewSubmit}>
                  <div className="mb-3">
                    <label className="form-label d-block">Your Rating</label>
                    <div className="d-flex gap-2 flex-wrap">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          type="button"
                          key={value}
                          className={`btn btn-sm ${Number(reviewForm.rating) === value ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setReviewForm((prev) => ({ ...prev, rating: String(value) }))}
                        >
                          {value} Star{value > 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="reviewComment" className="form-label">Comment</label>
                    <textarea
                      id="reviewComment"
                      rows="4"
                      className="form-control"
                      value={reviewForm.comment}
                      onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
                      placeholder="Share your experience with this course"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={submittingReview}>
                    {submittingReview ? 'Saving Review...' : 'Submit Review'}
                  </button>
                </form>

                <hr className="my-4" />

                <h4 className="h6 mb-3">Learner Reviews</h4>
                {(course.reviews || []).length ? (
                  <div className="d-flex flex-column gap-3">
                    {(course.reviews || []).map((review) => (
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
                  <p className="text-muted mb-0">No reviews yet.</p>
                )}
              </div>
            </div>
            <div className="col-md-4">
              <div className="card rounded-0">
                <div className="card-body">
                  <div className="h6">
                    <strong>{course.title}</strong>
                  </div>
                  <div className="small text-muted mb-3">{course.language?.name || 'Language N/A'}</div>

                  <Accordion defaultActiveKey="0" flush>
                    {(course.chapters || []).map((chapter) => (
                      <Accordion.Item eventKey={String(chapter.id)} key={chapter.id}>
                        <Accordion.Header>{chapter.title}</Accordion.Header>
                        <Accordion.Body className="pt-2 pb-0 ps-0">
                          {(chapter.lessons || []).length ? (
                            <ul className="lessons mb-0">
                              {(chapter.lessons || []).map((lesson) => (
                                <li className="pb-2" key={lesson.id}>
                                  <button
                                    type="button"
                                    className="btn btn-link p-0 text-start text-decoration-none"
                                    onClick={() => setSelectedLessonId(lesson.id)}
                                  >
                                    <MdSlowMotionVideo size={20} /> {lesson.title}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted mb-2">No lessons in this chapter.</p>
                          )}
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default WatchCourse;
