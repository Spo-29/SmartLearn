import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Accordion } from 'react-bootstrap';
import { FaRegEdit, FaRegTrashAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import UpdateChapter from './UpdateChapter';
import CreatedLesson from './CreatedLesson';
import LessonSort from './LessonSort';
import ChapterSort from './ChapterSort';

const ManageChapter = ({ courseId }) => {
  const navigate = useNavigate();
  const [newChapter, setNewChapter] = useState('');
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingChapter, setEditingChapter] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [defaultLessonChapterId, setDefaultLessonChapterId] = useState('');
  const [deletingLessonId, setDeletingLessonId] = useState(null);
  const [showChapterSort, setShowChapterSort] = useState(false);
  const [sortingChapterId, setSortingChapterId] = useState(null);
  const [sortingChapterOrder, setSortingChapterOrder] = useState(false);
  const [sortingLessonOrder, setSortingLessonOrder] = useState(false);

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

  const fetchChapters = async () => {
    if (!token) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/${courseId}/chapters`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (result.status === 200) {
        setChapters((result.data || []).map((chapter) => ({ ...chapter, lessons: chapter.lessons || [] })));
      } else {
        toast.error(result.message || 'Failed to load chapters.');
      }
    } catch (error) {
      toast.error('Failed to load chapters.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = async (payload) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/${courseId}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.status === 200) {
        setChapters((prev) =>
          prev.map((chapter) => {
            if (chapter.id !== result.data.chapter_id) {
              return chapter;
            }

            const nextLessons = [...(chapter.lessons || []), result.data].sort((a, b) => {
              if (a.sort_order === b.sort_order) {
                return a.id - b.id;
              }

              return a.sort_order - b.sort_order;
            });

            return {
              ...chapter,
              lessons: nextLessons,
            };
          }),
        );
        setActiveKey(String(result.data.chapter_id));
        setShowCreateLesson(false);
        toast.success(result.message || 'Lesson added successfully.');
      } else if (result.errors) {
        const firstError = Object.values(result.errors)[0]?.[0];
        toast.error(firstError || result.message || 'Failed to add lesson.');
      } else {
        toast.error(result.message || 'Failed to add lesson.');
      }

      return result;
    } catch (error) {
      toast.error('Failed to add lesson.');
      return { status: 500 };
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    setDeletingLessonId(lessonId);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.status === 200) {
        setChapters((prev) =>
          prev.map((chapter) => ({
            ...chapter,
            lessons: (chapter.lessons || []).filter((lesson) => lesson.id !== lessonId),
          })),
        );
        toast.success(result.message || 'Lesson deleted successfully.');
      } else {
        toast.error(result.message || 'Failed to delete lesson.');
      }
    } catch (error) {
      toast.error('Failed to delete lesson.');
    } finally {
      setDeletingLessonId(null);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, [courseId]);

  const handleStore = async (event) => {
    event.preventDefault();

    if (!newChapter.trim()) {
      toast.error('Chapter title is required.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/${courseId}/chapters`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: newChapter.trim() }),
        },
      );

      const result = await response.json();

      if (result.status === 200) {
        setNewChapter('');
        setChapters((prev) => [...prev, result.data]);
        setActiveKey(String(result.data.id));
        toast.success(result.message || 'Chapter saved successfully.');
      } else if (result.errors?.title?.[0]) {
        toast.error(result.errors.title[0]);
      } else {
        toast.error(result.message || 'Failed to save chapter.');
      }
    } catch (error) {
      toast.error('Failed to save chapter.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (chapterId) => {
    setDeletingId(chapterId);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/chapters/${chapterId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.status === 200) {
        setChapters((prev) => prev.filter((item) => item.id !== chapterId));
        if (activeKey === String(chapterId)) {
          setActiveKey(null);
        }
        toast.success(result.message || 'Chapter deleted successfully.');
      } else {
        toast.error(result.message || 'Failed to delete chapter.');
      }
    } catch (error) {
      toast.error('Failed to delete chapter.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdate = async (title) => {
    if (!editingChapter?.id) {
      return;
    }

    if (!title) {
      toast.error('Chapter title is required.');
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/chapters/${editingChapter.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title }),
        },
      );

      const result = await response.json();

      if (result.status === 200) {
        setChapters((prev) =>
          prev.map((item) => {
            if (item.id !== result.data.id) {
              return item;
            }

            return {
              ...result.data,
              lessons: item.lessons || [],
            };
          }),
        );
        setEditingChapter(null);
        toast.success(result.message || 'Chapter updated successfully.');
      } else if (result.errors?.title?.[0]) {
        toast.error(result.errors.title[0]);
      } else {
        toast.error(result.message || 'Failed to update chapter.');
      }
    } catch (error) {
      toast.error('Failed to update chapter.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSortChapters = async (orderedChapters) => {
    if (!token) {
      return false;
    }

    setSortingChapterOrder(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/${courseId}/chapters/sort`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ids: orderedChapters.map((item) => item.id) }),
        },
      );

      const result = await response.json();

      if (result.status === 200) {
        if (Array.isArray(result.data)) {
          setChapters(result.data.map((chapter) => ({ ...chapter, lessons: chapter.lessons || [] })));
        }
        toast.success(result.message || 'Order updated successfully.');
        setShowChapterSort(false);
        return true;
      }

      toast.error(result.message || 'Failed to update order.');
      return false;
    } catch (error) {
      toast.error('Failed to update order.');
      return false;
    } finally {
      setSortingChapterOrder(false);
    }
  };

  const handleSortLessons = async (chapterId, orderedLessons) => {
    if (!token) {
      return false;
    }

    setSortingLessonOrder(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/${courseId}/chapters/${chapterId}/lessons/sort`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ids: orderedLessons.map((item) => item.id) }),
        },
      );

      const result = await response.json();

      if (result.status === 200) {
        if (Array.isArray(result.data)) {
          setChapters((prev) =>
            prev.map((chapter) =>
              chapter.id === chapterId
                ? {
                    ...chapter,
                    lessons: result.data,
                  }
                : chapter,
            ),
          );
        }
        toast.success(result.message || 'Order updated successfully.');
        setSortingChapterId(null);
        return true;
      }

      toast.error(result.message || 'Failed to update order.');
      return false;
    } catch (error) {
      toast.error('Failed to update order.');
      return false;
    } finally {
      setSortingLessonOrder(false);
    }
  };

  return (
    <div className="card border-0 shadow-lg">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
          <h3 className="h5 mb-0">Chapters</h3>
          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              className="btn btn-link text-dark fw-semibold p-0"
              onClick={() => setShowChapterSort(true)}
              disabled={chapters.length < 2}
            >
              Reorder Chapters
            </button>
            <button
              type="button"
              className="btn btn-link text-dark fw-semibold p-0"
              onClick={() => {
                setDefaultLessonChapterId(activeKey || (chapters[0] ? String(chapters[0].id) : ''));
                setShowCreateLesson(true);
              }}
              disabled={chapters.length === 0}
            >
              + Add Lesson
            </button>
          </div>
        </div>

        <form onSubmit={handleStore}>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Chapter"
              value={newChapter}
              onChange={(event) => setNewChapter(event.target.value)}
              maxLength={255}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>

        <div className="mt-3">
          {loading ? (
            <p className="mb-0 text-muted">Loading chapters...</p>
          ) : chapters.length === 0 ? (
            <p className="mb-0 text-muted">No chapters added yet.</p>
          ) : (
            <Accordion
              activeKey={activeKey}
              onSelect={(eventKey) => setActiveKey(eventKey === activeKey ? null : eventKey)}
            >
              {chapters.map((chapter) => (
                <Accordion.Item eventKey={String(chapter.id)} key={chapter.id}>
                  <Accordion.Header>{chapter.title}</Accordion.Header>
                  <Accordion.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0">Lessons</h6>
                      <div className="d-flex align-items-center gap-3">
                        <button
                          type="button"
                          className="btn btn-link p-0"
                          onClick={() => setSortingChapterId(chapter.id)}
                          disabled={(chapter.lessons || []).length < 2}
                        >
                          Reorder Lessons
                        </button>
                        <button
                          type="button"
                          className="btn btn-link p-0"
                          onClick={() => {
                            setDefaultLessonChapterId(String(chapter.id));
                            setShowCreateLesson(true);
                          }}
                        >
                          Add Lesson
                        </button>
                      </div>
                    </div>

                    {chapter.lessons?.length ? (
                      <div className="mb-3">
                        {chapter.lessons.map((lesson) => (
                          <div
                            className="card border-0 bg-light mb-2"
                            key={lesson.id}
                          >
                            <div className="card-body py-2 px-3 d-flex align-items-center justify-content-between gap-3">
                              <button
                                type="button"
                                className="btn btn-link p-0 text-start text-decoration-none small fw-semibold"
                                onClick={() => navigate(`/account/courses/${courseId}/lessons/${lesson.id}`)}
                                title="View lesson"
                              >
                                {lesson.title}
                              </button>
                              <div className="d-flex align-items-center gap-2">
                                <button
                                  type="button"
                                  className="btn btn-link p-0 text-primary"
                                  title="Edit lesson"
                                  onClick={() => navigate(`/account/courses/${courseId}/lessons/${lesson.id}/edit`)}
                                >
                                  <FaRegEdit />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-link p-0 text-danger"
                                  title="Delete lesson"
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                  disabled={deletingLessonId === lesson.id}
                                >
                                  <FaRegTrashAlt />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="small text-muted mb-3">No lessons added yet.</p>
                    )}

                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(chapter.id)}
                        disabled={deletingId === chapter.id}
                      >
                        {deletingId === chapter.id ? 'Deleting...' : 'Delete Chapter'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setEditingChapter(chapter)}
                      >
                        Update Chapter
                      </button>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
        </div>
      </div>

      <UpdateChapter
        show={Boolean(editingChapter)}
        value={editingChapter?.title || ''}
        loading={updating}
        onClose={() => setEditingChapter(null)}
        onSave={handleUpdate}
      />

      <CreatedLesson
        show={showCreateLesson}
        chapters={chapters}
        defaultChapterId={defaultLessonChapterId}
        onClose={() => setShowCreateLesson(false)}
        onSave={handleCreateLesson}
      />

      <ChapterSort
        show={showChapterSort}
        chapters={chapters}
        loading={sortingChapterOrder}
        onClose={() => setShowChapterSort(false)}
        onSave={handleSortChapters}
      />

      <LessonSort
        show={Boolean(sortingChapterId)}
        chapter={chapters.find((chapter) => chapter.id === sortingChapterId) || null}
        loading={sortingLessonOrder}
        onClose={() => setSortingChapterId(null)}
        onSave={handleSortLessons}
      />
    </div>
  );
};

export default ManageChapter;
