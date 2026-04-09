import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../../common/Layout';
import UserSidebar from '../../../common/UserSidebar';

const EditLesson = () => {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [form, setForm] = useState({
    title: '',
    chapter_id: '',
    description: '',
    status: '1',
    is_free_preview: 'no',
    video: '',
  });
  const [errors, setErrors] = useState({});
  const [videoFile, setVideoFile] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [deletingVideo, setDeletingVideo] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');

  const resolveVideoUrl = (videoValue) => {
    if (!videoValue) {
      return '';
    }

    if (/^https?:\/\//i.test(videoValue)) {
      return videoValue;
    }

    return `${import.meta.env.VITE_BACKEND_ENDPOINT}/${String(videoValue).replace(/^\//, '')}`;
  };

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

        const lesson = result.data.lesson;

        setChapters(result.data.chapters || []);
        setForm({
          title: lesson?.title || '',
          chapter_id: lesson?.chapter_id ? String(lesson.chapter_id) : '',
          description: lesson?.description || '',
          status: String(lesson?.status ?? 1),
          is_free_preview: lesson?.is_free_preview || 'no',
          video: lesson?.video || '',
        });
        setVideoPreviewUrl(resolveVideoUrl(lesson?.video || ''));
        setVideoFile(null);
      } catch (error) {
        toast.error('Failed to load lesson details.');
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [token, lessonId, courseId, navigate]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));

    if (field === 'video') {
      setVideoPreviewUrl(resolveVideoUrl(value));
    }
  };

  const uploadLessonVideo = async () => {
    if (!videoFile) {
      return { status: 200 };
    }

    setUploadingVideo(true);

    try {
      const formData = new FormData();
      formData.append('video_file', videoFile);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/lessons/${lessonId}/video`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.status === 200) {
        const videoValue = result?.data?.video || '';
        setForm((prev) => ({ ...prev, video: videoValue }));
        setVideoPreviewUrl(resolveVideoUrl(videoValue));
        setVideoFile(null);
        toast.success(result.message || 'Lesson video uploaded successfully.');
        return result;
      }

      if (result.errors) {
        const firstError = Object.values(result.errors)[0]?.[0];
        toast.error(firstError || result.message || 'Failed to upload lesson video.');
      } else {
        toast.error(result.message || 'Failed to upload lesson video.');
      }

      return result;
    } catch (error) {
      toast.error('Failed to upload lesson video.');
      return { status: 500 };
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!token) {
      toast.error('Session expired. Please login again.');
      navigate('/account/login');
      return;
    }

    setDeletingVideo(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/lessons/${lessonId}/video`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.status === 200) {
        setForm((prev) => ({ ...prev, video: '' }));
        setVideoPreviewUrl('');
        setVideoFile(null);
        toast.success(result.message || 'Lesson video deleted successfully.');
        return;
      }

      toast.error(result.message || 'Failed to delete lesson video.');
    } catch (error) {
      toast.error('Failed to delete lesson video.');
    } finally {
      setDeletingVideo(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = 'Lesson is required.';
    }

    if (!form.chapter_id) {
      nextErrors.chapter_id = 'Chapter is required.';
    }

    if (!form.status) {
      nextErrors.status = 'Status is required.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/lessons/${lessonId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          chapter_id: Number(form.chapter_id),
          status: Number(form.status),
          description: form.description || null,
          video: form.video || null,
          is_free_preview: form.is_free_preview,
        }),
      });

      const result = await response.json();

      if (result.status === 200) {
        const uploadResult = await uploadLessonVideo();

        if (uploadResult.status !== 200) {
          setSaving(false);
          return;
        }

        toast.success(result.message || 'Lesson updated successfully.');
        navigate(`/account/courses/edit/${courseId}`);
      } else if (result.errors) {
        setErrors({
          title: result.errors.title?.[0] || '',
          chapter_id: result.errors.chapter_id?.[0] || '',
          status: result.errors.status?.[0] || '',
          description: result.errors.description?.[0] || '',
          video: result.errors.video?.[0] || '',
          is_free_preview: result.errors.is_free_preview?.[0] || '',
        });
      } else {
        toast.error(result.message || 'Failed to update lesson.');
      }
    } catch (error) {
      toast.error('Failed to update lesson.');
    } finally {
      setSaving(false);
    }
  };

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
                Edit Lesson
              </li>
            </ol>
          </nav>

          <div className="row">
            <div className="col-md-12 mt-5 mb-3 d-flex justify-content-between align-items-center">
              <h2 className="h4 mb-0 pb-0">Edit Lesson</h2>
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
                <form onSubmit={handleSubmit}>
                  <div className="card border-0 shadow-lg">
                    <div className="card-body p-4">
                      <h3 className="h5">Basic Information</h3>
                      <hr />

                      <div className="mb-3">
                        <label htmlFor="title">Title</label>
                        <input
                          id="title"
                          type="text"
                          className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                          placeholder="Lesson"
                          value={form.title}
                          onChange={(event) => handleChange('title', event.target.value)}
                          maxLength={255}
                        />
                        {errors.title && <p className="invalid-feedback">{errors.title}</p>}
                      </div>

                      <div className="mb-3">
                        <label htmlFor="chapter_id">Chapter</label>
                        <select
                          id="chapter_id"
                          className={`form-control ${errors.chapter_id ? 'is-invalid' : ''}`}
                          value={form.chapter_id}
                          onChange={(event) => handleChange('chapter_id', event.target.value)}
                        >
                          <option value="">Select a Chapter</option>
                          {chapters.map((chapter) => (
                            <option key={chapter.id} value={chapter.id}>
                              {chapter.title}
                            </option>
                          ))}
                        </select>
                        {errors.chapter_id && <p className="invalid-feedback">{errors.chapter_id}</p>}
                      </div>

                      <div className="mb-3">
                        <label htmlFor="description">Description</label>
                        <textarea
                          id="description"
                          rows="6"
                          className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                          placeholder="Description"
                          value={form.description}
                          onChange={(event) => handleChange('description', event.target.value)}
                        />
                        {errors.description && <p className="invalid-feedback">{errors.description}</p>}
                      </div>

                      <div className="mb-3">
                        <label htmlFor="video">Video URL</label>
                        <input
                          id="video"
                          type="text"
                          className={`form-control ${errors.video ? 'is-invalid' : ''}`}
                          placeholder="https://..."
                          value={form.video}
                          onChange={(event) => handleChange('video', event.target.value)}
                          maxLength={255}
                        />
                        {errors.video && <p className="invalid-feedback">{errors.video}</p>}
                        <small className="text-muted d-block mt-1">
                          You can provide an external video URL or upload a lesson video file below.
                        </small>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="video_file">Upload Lesson Video</label>
                        <input
                          id="video_file"
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/x-msvideo"
                          className="form-control"
                          onChange={(event) => setVideoFile(event.target.files?.[0] || null)}
                        />
                        <small className="text-muted d-block mt-1">
                          Supported formats: MP4, MOV, AVI, MKV, WEBM. Max size: 500MB.
                        </small>
                        {videoFile && (
                          <small className="text-muted d-block mt-1">Selected file: {videoFile.name}</small>
                        )}
                      </div>

                      {videoPreviewUrl && (
                        <div className="mb-3">
                          <label className="form-label">Current Lesson Video</label>
                          <div className="border rounded p-2 bg-light">
                            <video controls width="100%" style={{ maxHeight: '320px' }}>
                              <source src={videoPreviewUrl} />
                              Your browser does not support the video tag.
                            </video>
                            <div className="mt-2">
                              <a href={videoPreviewUrl} target="_blank" rel="noreferrer" className="small">
                                Open video in new tab
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {(form.video || videoPreviewUrl) && (
                        <div className="mb-3">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={handleDeleteVideo}
                            disabled={deletingVideo}
                          >
                            {deletingVideo ? 'Deleting Video...' : 'Delete Lesson Video'}
                          </button>
                        </div>
                      )}

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="status">Status</label>
                          <select
                            id="status"
                            className={`form-control ${errors.status ? 'is-invalid' : ''}`}
                            value={form.status}
                            onChange={(event) => handleChange('status', event.target.value)}
                          >
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                          </select>
                          {errors.status && <p className="invalid-feedback">{errors.status}</p>}
                        </div>

                        <div className="col-md-6 mb-3">
                          <label htmlFor="is_free_preview">Free Lesson</label>
                          <select
                            id="is_free_preview"
                            className={`form-control ${errors.is_free_preview ? 'is-invalid' : ''}`}
                            value={form.is_free_preview}
                            onChange={(event) => handleChange('is_free_preview', event.target.value)}
                          >
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                          </select>
                          {errors.is_free_preview && <p className="invalid-feedback">{errors.is_free_preview}</p>}
                        </div>
                      </div>

                      <button className="btn btn-primary" disabled={saving || uploadingVideo}>
                        {saving || uploadingVideo ? 'Updating...' : 'Update Lesson'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default EditLesson;
