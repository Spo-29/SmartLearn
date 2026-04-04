import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Layout from '../../../common/Layout';
import UserSidebar from '../../../common/UserSidebar';
import ManageChapter from './ManageChapter'; // The component we built first
import { apiUrl } from '../../../../common/Config';

const EditCourse = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [categories, setCategories] = useState([]);

    const token = useMemo(() => {
        const raw = localStorage.getItem('userInfoLms');
        return raw ? JSON.parse(raw)?.token : null;
    }, []);

    const [form, setForm] = useState({
        title: '',
        category_id: '',
        price: '',
        description: '',
        status: '1'
    });

    useEffect(() => {
        if (!token) {
            navigate('/account/login');
            return;
        }

        const fetchCourseData = async () => {
            try {
                const res = await fetch(`${apiUrl}/courses/${id}/edit`, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
                const result = await res.json();
                
                if (result.status === 200) {
                    setCourse(result.data.course);
                    setCategories(result.data.categories || []);
                    setForm({
                        title: result.data.course.title || '',
                        category_id: result.data.course.category_id || '',
                        price: result.data.course.price || '',
                        description: result.data.course.description || '',
                        status: String(result.data.course.status)
                    });
                }
            } catch (err) {
                toast.error("Failed to load course");
            } finally {
                setLoading(false);
            }
        };

        fetchCourseData();
    }, [id, token, navigate]);

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${apiUrl}/courses/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                toast.success("Course details updated!");
            }
        } catch (err) {
            toast.error("Update failed");
        }
    };

    if (loading) return <Layout><div className="container p-5">Loading...</div></Layout>;

    return (
        <Layout>
            <section className="section-4">
                <div className="container pb-5 pt-4">
                    {/* Breadcrumb */}
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item"><Link to="/account/dashboard">Account</Link></li>
                            <li className="breadcrumb-item active">Edit Course</li>
                        </ol>
                    </nav>

                    <div className="row">
                        <div className="col-lg-3">
                            <UserSidebar />
                        </div>

                        <div className="col-lg-9">
                            {/* General Information Card */}
                            <div className="card border-0 shadow-sm mb-4">
                                <div className="card-body p-4">
                                    <h3 className="h5 mb-3 fw-bold">General Information</h3>
                                    <hr />
                                    <form onSubmit={handleUpdateCourse}>
                                        <div className="mb-3">
                                            <label className="form-label">Course Title</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                value={form.title} 
                                                onChange={e => setForm({...form, title: e.target.value})} 
                                            />
                                        </div>
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Category</label>
                                                <select 
                                                    className="form-select" 
                                                    value={form.category_id}
                                                    onChange={e => setForm({...form, category_id: e.target.value})}
                                                >
                                                    <option value="">Select Category</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Price ($)</label>
                                                <input 
                                                    type="number" 
                                                    className="form-control" 
                                                    value={form.price} 
                                                    onChange={e => setForm({...form, price: e.target.value})} 
                                                />
                                            </div>
                                        </div>
                                        <button className="btn btn-primary">Update Basic Info</button>
                                    </form>
                                </div>
                            </div>

                            {/* Chapter & Lesson Management Section */}
                            {/* This pulls in the UI from your first image */}
                            <ManageChapter 
                                course={course} 
                                params={{ id: id }} 
                            />
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default EditCourse;