import React, { useState, useReducer, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Accordion } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { apiUrl } from '../../../../common/Config';
import CreateLesson from './CreateLesson';
import UpdateChapter from './UpdateChapter';
import LessonSort from './LessonSort'; // The Modal component we created

const ManageChapter = ({ course, params }) => {
    const token = localStorage.getItem('token');
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const [loading, setLoading] = useState(false);
    
    // --- Modal States ---
    const [chapterData, setChapterData] = useState(null);
    const [showChapterModal, setShowChapterModal] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);
    
    // --- Sorting States ---
    const [showSortModal, setShowSortModal] = useState(false);
    const [sortingChapter, setSortingChapter] = useState(null);

    const handleCloseChapter = () => setShowChapterModal(false);
    const handleShowChapter = (chapter) => {
        setChapterData(chapter);
        setShowChapterModal(true);
    };

    const handleCloseLessonModal = () => setShowLessonModal(false);
    const handleShowLessonModal = () => setShowLessonModal(true);

    // --- Chapter State Reducer ---
    const chapterReducer = (state, action) => {
        switch (action.type) {
            case "SET_CHAPTERS": 
                return action.payload;
            case "ADD_CHAPTER": 
                return [...state, action.payload];
            case "UPDATE_CHAPTER": 
                return state.map(c => c.id === action.payload.id ? action.payload : c);
            case "UPDATE_LESSON_ORDER":
                return state.map(c => c.id === action.payload.chapterId 
                    ? { ...c, lessons: action.payload.sortedLessons } 
                    : c
                );
            case "DELETE_CHAPTER": 
                return state.filter(c => c.id !== action.payload);
            case "DELETE_LESSON": 
                return state.map(chapter => ({
                    ...chapter,
                    lessons: chapter.lessons ? chapter.lessons.filter(l => l.id !== action.payload) : []
                }));
            default: 
                return state;
        }
    };
    
    const [chapters, setChapters] = useReducer(chapterReducer, []);

    useEffect(() => {
        if (course?.chapters) {
            setChapters({ type: "SET_CHAPTERS", payload: course.chapters });
        }
    }, [course]);

    // --- Create Chapter ---
    const onSubmit = async (data) => {
        setLoading(true);
        const formData = { ...data, course_id: params.id };
        try {
            const res = await fetch(`${apiUrl}/chapters`, {
                method: 'POST',
                headers: { 
                    'Content-type': 'application/json', 
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(formData)
            });
            const result = await res.json();
            if (result.status === 200 || result.status === 201) {
                setChapters({ type: "ADD_CHAPTER", payload: result.data });
                toast.success("Chapter created successfully!");
                reset();
            }
        } catch (err) { 
            toast.error("Failed to create chapter");
        }
        setLoading(false);
    };

    // --- Save Lesson Order ---
    const handleLessonSortEnd = async (chapterId, sortedLessons) => {
        // Optimistic UI update
        setChapters({ 
            type: "UPDATE_LESSON_ORDER", 
            payload: { chapterId, sortedLessons } 
        });

        try {
            await fetch(`${apiUrl}/lessons/reorder`, {
                method: 'POST',
                headers: { 
                    'Content-type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    chapter_id: chapterId, 
                    lesson_ids: sortedLessons.map(l => l.id) 
                })
            });
            toast.success("Order saved successfully!");
        } catch (err) {
            toast.error("Failed to sync order with server.");
        }
    };

    // --- Delete Chapter ---
    const deleteChapter = async (id) => {
        if (window.confirm("Are you sure you want to delete this chapter?")) {
            try {
                const res = await fetch(`${apiUrl}/chapters/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setChapters({ type: "DELETE_CHAPTER", payload: id });
                    toast.success("Chapter deleted successfully!");
                }
            } catch (err) { 
                toast.error("An error occurred during deletion.");
            }
        }
    };

    // --- Delete Lesson ---
    const deleteLesson = async (id) => {
        if (window.confirm("Are you sure you want to delete this lesson?")) {
            try {
                const res = await fetch(`${apiUrl}/lessons/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setChapters({ type: "DELETE_LESSON", payload: id });
                    toast.success("Lesson deleted successfully!");
                }
            } catch (err) {
                toast.error("An error occurred during deletion.");
            }
        }
    };

    return (
        <div className='card shadow-sm border-0 mt-4'>
            <div className='card-body p-4'>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className='h5 mb-0'>Create Chapter</h4>
                    <button onClick={handleShowLessonModal} className="btn btn-link text-dark fw-bold text-decoration-none p-0">
                        <FaPlus size={12} className="me-1"/> Create Lesson
                    </button>
                </div>

                <form className='mb-5' onSubmit={handleSubmit(onSubmit)}>
                    <div className='mb-3'>
                        <input 
                            {...register("chapter", { required: "Chapter name is required" })} 
                            className={`form-control ${errors.chapter && 'is-invalid'}`} 
                            placeholder='Chapter Name' 
                        />
                        {errors.chapter && <div className="invalid-feedback">{errors.chapter.message}</div>}
                    </div>
                    <button disabled={loading} className='btn' style={{backgroundColor: '#20c997', color: '#fff'}}>
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </form>

                <div className="d-flex justify-content-between mb-2">
                    <h5 className="h6 fw-bold">Chapters</h5>
                    <small className="text-muted cursor-pointer">Reorder Chapters</small>
                </div>

                <Accordion>
                    {chapters.map((chapter, index) => (
                        <Accordion.Item eventKey={index.toString()} key={chapter.id} className="mb-3 border rounded shadow-sm">
                            <Accordion.Header className="fw-bold">
                                {chapter.chapter_name || `Module ${index + 1}: ${chapter.chapter}`}
                            </Accordion.Header>
                            <Accordion.Body>
                                <div className="d-flex justify-content-between small mb-3">
                                    <span className="fw-bold">Lessons</span>
                                    {/* Modal Trigger for Sorting */}
                                    <span 
                                        className="text-muted cursor-pointer fw-bold" 
                                        onClick={() => {
                                            setSortingChapter(chapter);
                                            setShowSortModal(true);
                                        }}
                                    >
                                        Reorder Lessons
                                    </span>
                                </div>

                                {chapter.lessons && chapter.lessons.length > 0 ? (
                                    chapter.lessons.map(lesson => (
                                        <div key={lesson.id} className="d-flex justify-content-between align-items-center bg-light p-2 mb-2 rounded border shadow-sm">
                                            <span className="small">{lesson.title || lesson.name}</span>
                                            <div className="d-flex align-items-center">
                                                <span className="text-muted small me-3">{lesson.duration || '0'} mins</span>
                                                {lesson.is_free_preview === 'yes' && (
                                                    <span className="badge bg-success me-2 py-1 px-2" style={{fontSize: '10px'}}>Preview</span>
                                                )}
                                                <FaEdit className="me-2 cursor-pointer text-dark" />
                                                <FaTrash 
                                                    className="text-danger cursor-pointer" 
                                                    onClick={() => deleteLesson(lesson.id)} 
                                                />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted small">No lessons available in this chapter.</p>
                                )}

                                <div className='d-flex mt-4 pt-3 border-top'>
                                    <button 
                                        onClick={() => deleteChapter(chapter.id)} 
                                        className='btn btn-danger btn-sm me-2 rounded-2 px-3'
                                    >
                                        Delete Chapter
                                    </button>
                                    <button 
                                        onClick={() => handleShowChapter(chapter)} 
                                        className='btn btn-sm text-white rounded-2 px-3' 
                                        style={{backgroundColor: '#20c997'}}
                                    >
                                        Update Chapter
                                    </button>
                                </div>
                            </Accordion.Body>
                        </Accordion.Item>
                    ))}
                </Accordion>
            </div>
            
            {/* Sorting Modal */}
            <LessonSort 
                show={showSortModal}
                handleClose={() => setShowSortModal(false)}
                initialLessons={sortingChapter?.lessons || []}
                onSortEnd={(sorted) => handleLessonSortEnd(sortingChapter.id, sorted)}
            />

            {showChapterModal && (
                <UpdateChapter 
                    showChapter={showChapterModal} 
                    handleClose={handleCloseChapter} 
                    chapterData={chapterData} 
                    setChapters={setChapters} 
                />
            )}
            
            {showLessonModal && (
                <CreateLesson 
                    showLessonModal={showLessonModal} 
                    handleCloseLessonModal={handleCloseLessonModal} 
                    course={course} 
                />
            )}
        </div>
    );
};

export default ManageChapter;