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
        title: '', chapter_id: '', description: '', status: '1', is_free_preview: 'no', video: '',
    });
    const [errors, setErrors] = useState({});

    const token = useMemo(() => {
        const raw = localStorage.getItem('userInfoLms');
        return raw ? JSON.parse(raw)?.token : null;
    }, []);

    useEffect(() => {
        if (!token) { navigate('/account/login'); return; }
        const load = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/lessons/${lessonId}`, {
                    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }
                });
                const result = await res.json();
                if (result.status === 200) {
                    const lesson = result.data.lesson;
                    setChapters(result.data.chapters || []);
                    setForm({
                        title: lesson?.title || '',
                        chapter_id: String(lesson?.chapter_id || ''),
                        description: lesson?.description || '',
                        status: String(lesson?.status ?? 1),
                        is_free_preview: lesson?.is_free_preview || 'no',
                        video: lesson?.video || '',
                    });
                }
            } catch (err) { toast.error("Load failed"); }
            setLoading(false);
        };
        load();
    }, [token, lessonId, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/lessons/${lessonId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                toast.success("Lesson updated!");
                navigate(`/account/courses/edit/${courseId}`);
            }
        } catch (err) { toast.error("Update failed"); }
        setSaving(false);
    };

    return (
        <Layout>
            <div className="container pb-5 pt-4">
                <h2 className="h4 mb-4">Edit Lesson</h2>
                <div className="row">
                    <div className="col-lg-3">
                        <UserSidebar />
                    </div>
                    <div className="col-lg-9">
                        <form onSubmit={handleSubmit} className="card border-0 shadow-sm p-4">
                            <h3 className="h5 mb-3">Basic Information</h3>
                            <hr />
                            <div className="mb-3">
                                <label className="form-label">Title</label>
                                <input type="text" className="form-control" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Chapter</label>
                                <select className="form-select" value={form.chapter_id} onChange={e => setForm({...form, chapter_id: e.target.value})}>
                                    <option value="">Select Chapter</option>
                                    {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                            </div>
                            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Update Lesson'}</button>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default EditLesson;