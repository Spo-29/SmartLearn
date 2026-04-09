import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Layout from '../common/Layout';

const CourseLessonBasicInfo = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lesson, setLesson] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [course, setCourse] = useState(null);

  const fallbackPath = `/detail/${courseId}`;
  const sourcePath = typeof location.state?.from === 'string' ? location.state.from : fallbackPath;

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(sourcePath);
  };

  useEffect(() => {
    if (!courseId || !lessonId) {
      setError('Lesson not found.');
      setLoading(false);
      return;
    }

    const fetchLesson = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/fetch-course/${courseId}/lessons/${lessonId}`,
          {
            headers: {
              Accept: 'application/json',
            },
          },
        );

        const result = await response.json();

        if (result.status !== 200) {
          setError(result.message || 'Failed to load lesson details.');
          setLesson(null);
          setChapter(null);
          setCourse(null);
          return;
        }

        setLesson(result.data?.lesson || null);
        setChapter(result.data?.chapter || null);
        setCourse(result.data?.course || null);
      } catch {
        setError('Failed to load lesson details.');
        setLesson(null);
        setChapter(null);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [courseId, lessonId]);

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
            <li className="breadcrumb-item">
              <Link to={fallbackPath}>{course?.title || 'Course Details'}</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Lesson Basic Info
            </li>
          </ol>
        </nav>

        <div className="col-md-12 mt-5 mb-3 d-flex justify-content-between align-items-center">
          <h2 className="h4 mb-0 pb-0">Lesson Basic Info</h2>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleBack}>
            Back
          </button>
        </div>

        {loading ? (
          <div className="card border-0 shadow-lg">
            <div className="card-body p-4">
              <p className="mb-0">Loading lesson details...</p>
            </div>
          </div>
        ) : error ? (
          <div className="card border-0 shadow-lg">
            <div className="card-body p-4">
              <p className="mb-0 text-danger">{error}</p>
            </div>
          </div>
        ) : (
          <div className="card border-0 shadow-lg">
            <div className="card-body p-4">
              <h3 className="h5">Basic Information</h3>
              <hr />

              <div className="mb-3">
                <label className="form-label">Title</label>
                <input type="text" className="form-control" value={lesson?.title || ''} readOnly />
              </div>

              <div className="mb-3">
                <label className="form-label">Chapter</label>
                <input type="text" className="form-control" value={chapter?.title || ''} readOnly />
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows="6" value={lesson?.description || ''} readOnly />
              </div>

              <div className="mb-3">
                <label className="form-label">Video URL</label>
                <input type="text" className="form-control" value={lesson?.video || ''} readOnly />
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Status</label>
                  <input
                    type="text"
                    className="form-control"
                    value={Number(lesson?.status) === 1 ? 'Active' : 'Inactive'}
                    readOnly
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Free Lesson</label>
                  <input
                    type="text"
                    className="form-control"
                    value={lesson?.is_free_preview === 'yes' ? 'Yes' : 'No'}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CourseLessonBasicInfo;
