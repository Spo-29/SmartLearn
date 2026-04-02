import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../../common/Layout';
import UserSidebar from '../../../common/UserSidebar';

const LessonBasicInfo = () => {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();

  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(null);
  const [chapterName, setChapterName] = useState('');

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

  useEffect(() => {
    if (!token) {
      toast.error('Please login first.');
      navigate('/account/login');
      return;
    }

    const loadLesson = async () => {
      setLoading(true);

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/lessons/${lessonId}`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (result.status !== 200) {
          toast.error(result.message || 'Failed to load lesson details.');
          navigate(`/account/courses/edit/${courseId}`);
          return;
        }

        const lessonData = result.data.lesson;
        const matchedChapter = (result.data.chapters || []).find(
          (chapter) => chapter.id === lessonData.chapter_id,
        );

        setLesson(lessonData);
        setChapterName(matchedChapter?.title || '');
      } catch (error) {
        toast.error('Failed to load lesson details.');
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [token, lessonId, courseId, navigate]);

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
                <Link to={`/account/courses/edit/${courseId}`}>Edit Course</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Lesson Basic Info
              </li>
            </ol>
          </nav>

          <div className="row">
            <div className="col-md-12 mt-5 mb-3 d-flex justify-content-between align-items-center">
              <h2 className="h4 mb-0 pb-0">Lesson Basic Info</h2>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate(`/account/courses/edit/${courseId}`)}
              >
                Back to Edit Course
              </button>
            </div>

            <div className="col-lg-3 account-sidebar">
              <UserSidebar />
            </div>

            <div className="col-lg-9">
              {loading ? (
                <div className="card border-0 shadow-lg">
                  <div className="card-body p-4">
                    <p className="mb-0">Loading lesson details...</p>
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
                      <input type="text" className="form-control" value={chapterName} readOnly />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows="6"
                        value={lesson?.description || ''}
                        readOnly
                      />
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
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default LessonBasicInfo;
