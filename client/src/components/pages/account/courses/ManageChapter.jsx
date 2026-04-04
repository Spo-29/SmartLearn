import React, { useState, useReducer, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Accordion, Button } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaRegEye } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { apiUrl } from '../../../../common/Config';
import CreateLesson from './CreateLesson';
import UpdateChapter from './UpdateChapter';

const ManageChapter = ({ course, params }) => {
    const token = localStorage.getItem('token');
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const [loading, setLoading] = useState(false);
    
    // Modal States
    const [chapterData, setChapterData] = useState(null);
    const [showChapterModal, setShowChapterModal] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);

    const handleCloseChapter = () => setShowChapterModal(false);
    const handleShowChapter = (chapter) => {
        setChapterData(chapter);
        setShowChapterModal(true);
    };

    const handleCloseLessonModal = () => setShowLessonModal(false);
    const handleShowLessonModal = () => setShowLessonModal(true);

    // Chapter State Reducer
    const chapterReducer = (state, action) => {
        switch (action.type) {
            case "SET_CHAPTERS": return action.payload;
            case "ADD_CHAPTER": return [...state, action.payload];
            case "UPDATE_CHAPTER": return state.map(c => c.id === action.payload.id ? action.payload : c);
            case "DELETE_CHAPTER": return state.filter(c => c.id !== action.payload);
            default: return state;
        }
    };
    const [chapters, setChapters] = useReducer(chapterReducer, []);

    useEffect(() => {
        if (course?.chapters) {
            setChapters({ type: "SET_CHAPTERS", payload: course.chapters });
        }
    }, [course]);

    const onSubmit = async (data) => {
        setLoading(true);
        const formData = { ...data, course_id: params.id };
        try {
            const res = await fetch(`${apiUrl}/chapters`, {
                method: 'POST',
                headers: { 'Content-type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const result = await res.json();
            if (result.status === 200) {
                setChapters({ type: "ADD_CHAPTER", payload: result.data });
                toast.success("Chapter Created");
                reset();
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const deleteChapter = async (id) => {
        if (!window.confirm("Delete this chapter?")) return;
        try {
            const res = await fetch(`${apiUrl}/chapters/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setChapters({ type: "DELETE_CHAPTER", payload: id });
                toast.success("Chapter Deleted");
            }
        } catch (err) { console.error(err); }
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
                        <input {...register("chapter", { required: true })} className={`form-control ${errors.chapter && 'is-invalid'}`} placeholder='Chapter Name' />
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
                            <Accordion.Header className="fw-bold">{chapter.chapter_name || `Module ${index + 1}: ${chapter.chapter}`}</Accordion.Header>
                            <Accordion.Body>
                                <div className="d-flex justify-content-between small mb-3">
                                    <span className="fw-bold">Lessons</span>
                                    <span className="text-muted">Reorder Lessons</span>
                                </div>

                                {chapter.lessons?.map(lesson => (
                                    <div key={lesson.id} className="d-flex justify-content-between align-items-center bg-light p-2 mb-2 rounded border">
                                        <span className="small">{lesson.title}</span>
                                        <div className="d-flex align-items-center">
                                            <span className="text-muted small me-3">{lesson.duration || '20'} mins</span>
                                            <span className="badge bg-success me-2 py-1 px-2" style={{fontSize: '10px'}}>Preview</span>
                                            <FaEdit className="me-2 cursor-pointer text-dark" />
                                            <FaTrash className="text-danger cursor-pointer" />
                                        </div>
                                    </div>
                                ))}

                                <div className='d-flex mt-4'>
                                    <button onClick={() => deleteChapter(chapter.id)} className='btn btn-danger btn-sm me-2'>Delete Chapter</button>
                                    <button onClick={() => handleShowChapter(chapter)} className='btn btn-sm text-white' style={{backgroundColor: '#20c997'}}>Update Chapter</button>
                                </div>
                            </Accordion.Body>
                        </Accordion.Item>
                    ))}
                </Accordion>
            </div>
            <UpdateChapter showChapter={showChapterModal} handleClose={handleCloseChapter} chapterData={chapterData} setChapters={setChapters} />
            <CreateLesson showLessonModal={showLessonModal} handleCloseLessonModal={handleCloseLessonModal} course={course} />
        </div>
    );
};

export default ManageChapter;