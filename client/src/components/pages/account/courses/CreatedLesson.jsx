import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';

const CreatedLesson = ({ show, chapters, defaultChapterId, onClose, onSave }) => {
  const [form, setForm] = useState({
    chapter_id: '',
    title: '',
    status: '1',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const chapterOptions = useMemo(() => chapters || [], [chapters]);

  useEffect(() => {
    if (!show) {
      return;
    }

    setForm({
      chapter_id: defaultChapterId || (chapterOptions[0] ? String(chapterOptions[0].id) : ''),
      title: '',
      status: '1',
    });
    setErrors({});
  }, [show, defaultChapterId, chapterOptions]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!form.chapter_id) {
      nextErrors.chapter_id = 'Chapter is required.';
    }

    if (!form.title.trim()) {
      nextErrors.title = 'Lesson is required.';
    }

    if (!form.status) {
      nextErrors.status = 'Status is required.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);

    const response = await onSave({
      chapter_id: Number(form.chapter_id),
      title: form.title.trim(),
      status: Number(form.status),
    });

    if (response?.errors) {
      setErrors({
        chapter_id: response.errors.chapter_id?.[0] || '',
        title: response.errors.title?.[0] || '',
        status: response.errors.status?.[0] || '',
      });
    }

    setLoading(false);
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create Lesson</Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="lessonChapter" className="form-label">
              Chapter
            </label>
            <select
              id="lessonChapter"
              className={`form-control ${errors.chapter_id ? 'is-invalid' : ''}`}
              value={form.chapter_id}
              onChange={(event) => handleChange('chapter_id', event.target.value)}
            >
              <option value="">Select a Chapter</option>
              {chapterOptions.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.title}
                </option>
              ))}
            </select>
            {errors.chapter_id && <p className="invalid-feedback">{errors.chapter_id}</p>}
          </div>

          <div className="mb-3">
            <label htmlFor="lessonTitle" className="form-label">
              Lesson
            </label>
            <input
              id="lessonTitle"
              type="text"
              className={`form-control ${errors.title ? 'is-invalid' : ''}`}
              placeholder="Lesson"
              value={form.title}
              onChange={(event) => handleChange('title', event.target.value)}
              maxLength={255}
            />
            {errors.title && <p className="invalid-feedback">{errors.title}</p>}
          </div>

          <div className="mb-2">
            <label htmlFor="lessonStatus" className="form-label">
              Status
            </label>
            <select
              id="lessonStatus"
              className={`form-control ${errors.status ? 'is-invalid' : ''}`}
              value={form.status}
              onChange={(event) => handleChange('status', event.target.value)}
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
            {errors.status && <p className="invalid-feedback">{errors.status}</p>}
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-content-start">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default CreatedLesson;
