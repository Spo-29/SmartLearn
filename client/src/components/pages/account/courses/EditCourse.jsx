import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../../common/Layout';
import { Link, useNavigate, useParams } from 'react-router-dom';
import UserSidebar from '../../../common/UserSidebar';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import ManageOutcome from './ManageOutcome';
import ManageRequirement from './ManageRequirement';
import EditCover from './EditCover';

const EditCourse = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [course, setCourse] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm({
    defaultValues: {
      title: '',
      category_id: '',
      level_id: '',
      language_id: '',
      description: '',
      price: '',
      cross_price: '',
      status: 1,
      is_featured: 'no',
    },
  });

  const [meta, setMeta] = useState({
    categories: [],
    levels: [],
    languages: [],
  });
  const [loading, setLoading] = useState(true);

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

    const loadEditPageData = async () => {
      setLoading(true);
      try {
        const [metaResponse, courseResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/meta`, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/${id}/edit`, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const metaResult = await metaResponse.json();
        const courseResult = await courseResponse.json();

        if (metaResult.status !== 200) {
          toast.error(metaResult.message || 'Failed to load metadata.');
          return;
        }

        if (courseResult.status !== 200) {
          toast.error(courseResult.message || 'Failed to load course details.');
          navigate('/account/my-courses');
          return;
        }

        setMeta({
          categories: metaResult.categories || [],
          levels: metaResult.levels || [],
          languages: metaResult.languages || [],
        });

        const course = courseResult.data;

        reset({
          title: course?.title || '',
          category_id: course?.category_id || '',
          level_id: course?.level_id || '',
          language_id: course?.language_id || '',
          description: course?.description || '',
          price: course?.price ?? '',
          cross_price: course?.cross_price ?? '',
          status: course?.status ?? 1,
          is_featured: course?.is_featured || 'no',
        });
      } catch (error) {
        toast.error('Something went wrong while loading course details.');
      } finally {
        setLoading(false);
      }
    };

    loadEditPageData();
  }, [id, navigate, reset, token]);

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Session expired. Please login again.');
      navigate('/account/login');
      return;
    }

    const payload = {
      title: data.title,
      category_id: data.category_id === '' ? null : Number(data.category_id),
      level_id: data.level_id === '' ? null : Number(data.level_id),
      language_id: data.language_id === '' ? null : Number(data.language_id),
      description: data.description || null,
      price: data.price === '' ? null : Number(data.price),
      cross_price: data.cross_price === '' ? null : Number(data.cross_price),
      status: Number(data.status),
      is_featured: data.is_featured,
    };

    await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.status === 200) {
          toast.success(result.message || 'Course updated successfully.');
        } else if (result.errors) {
          Object.keys(result.errors).forEach((field) => {
            setError(field, {
              type: 'server',
              message: result.errors[field][0],
            });
          });
         setCourse(result.data);
        } else {
          toast.error(result.message || 'Failed to update course.');
        }
      })
      .catch(() => {
        toast.error('Something went wrong while updating the course.');
      });
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
              <li className="breadcrumb-item active" aria-current="page">
                Edit Course
              </li>
            </ol>
          </nav>

          <div className="row">
            <div className="col-md-12 mt-5 mb-3">
              <div className="d-flex justify-content-between">
                <h2 className="h4 mb-0 pb-0">Edit Course</h2>
              </div>
            </div>

            <div className="col-lg-3 account-sidebar">
              <UserSidebar />
            </div>

            <div className="col-lg-9">
              {loading ? (
                <div className="card border-0 shadow-lg">
                  <div className="card-body p-4">
                    <p className="mb-0">Loading course details...</p>
                  </div>
                </div>
              ) : (
                <div className="row g-3 align-items-start">
                  <div className="col-lg-8">
                    <form onSubmit={handleSubmit(onSubmit)}>
                      <div className="card border-0 shadow-lg">
                        <div className="card-body p-4">
                          <h3 className="h5">Course Details</h3>
                          <hr />

                          <div className="mb-3">
                            <label htmlFor="title">Title</label>
                            <input
                              id="title"
                              type="text"
                              {...register('title', {
                                required: 'Course title is required.',
                                minLength: {
                                  value: 5,
                                  message: 'Course title must be at least 5 characters.',
                                },
                              })}
                              className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                              placeholder="Enter course title"
                            />
                            {errors.title && <p className="invalid-feedback">{errors.title.message}</p>}
                          </div>

                          <div className="mb-3">
                            <label htmlFor="category_id">Category</label>
                            <select
                              id="category_id"
                              {...register('category_id')}
                              className={`form-control ${errors.category_id ? 'is-invalid' : ''}`}
                            >
                              <option value="">Select category</option>
                              {meta.categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                            {errors.category_id && <p className="invalid-feedback">{errors.category_id.message}</p>}
                          </div>

                          <div className="mb-3">
                            <label htmlFor="level_id">Level</label>
                            <select
                              id="level_id"
                              {...register('level_id')}
                              className={`form-control ${errors.level_id ? 'is-invalid' : ''}`}
                            >
                              <option value="">Select level</option>
                              {meta.levels.map((level) => (
                                <option key={level.id} value={level.id}>
                                  {level.name}
                                </option>
                              ))}
                            </select>
                            {errors.level_id && <p className="invalid-feedback">{errors.level_id.message}</p>}
                          </div>

                          <div className="mb-3">
                            <label htmlFor="language_id">Language</label>
                            <select
                              id="language_id"
                              {...register('language_id')}
                              className={`form-control ${errors.language_id ? 'is-invalid' : ''}`}
                            >
                              <option value="">Select language</option>
                              {meta.languages.map((language) => (
                                <option key={language.id} value={language.id}>
                                  {language.name}
                                </option>
                              ))}
                            </select>
                            {errors.language_id && <p className="invalid-feedback">{errors.language_id.message}</p>}
                          </div>

                          <div className="mb-3">
                            <label htmlFor="description">Description</label>
                            <textarea
                              id="description"
                              rows="5"
                              {...register('description')}
                              className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                              placeholder="Write course description"
                            />
                            {errors.description && <p className="invalid-feedback">{errors.description.message}</p>}
                          </div>

                          <h3 className="h5 mt-3">Pricing</h3>
                          <hr />

                          <div className="mb-3">
                            <label htmlFor="price">Sell Price</label>
                            <input
                              id="price"
                              type="number"
                              step="0.01"
                              min="0"
                              {...register('price')}
                              className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                              placeholder="0.00"
                            />
                            {errors.price && <p className="invalid-feedback">{errors.price.message}</p>}
                          </div>

                          <div className="mb-3">
                            <label htmlFor="cross_price">Cross Price</label>
                            <input
                              id="cross_price"
                              type="number"
                              step="0.01"
                              min="0"
                              {...register('cross_price')}
                              className={`form-control ${errors.cross_price ? 'is-invalid' : ''}`}
                              placeholder="0.00"
                            />
                            {errors.cross_price && <p className="invalid-feedback">{errors.cross_price.message}</p>}
                          </div>

                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label htmlFor="is_featured">Featured</label>
                              <select
                                id="is_featured"
                                {...register('is_featured')}
                                className={`form-control ${errors.is_featured ? 'is-invalid' : ''}`}
                              >
                                <option value="no">No</option>
                                <option value="yes">Yes</option>
                              </select>
                              {errors.is_featured && <p className="invalid-feedback">{errors.is_featured.message}</p>}
                            </div>

                            <div className="col-md-6 mb-3">
                              <label htmlFor="status">Status</label>
                              <select
                                id="status"
                                {...register('status')}
                                className={`form-control ${errors.status ? 'is-invalid' : ''}`}
                              >
                                <option value={1}>Active</option>
                                <option value={0}>Inactive</option>
                              </select>
                              {errors.status && <p className="invalid-feedback">{errors.status.message}</p>}
                            </div>
                          </div>

                          <button className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Updating...' : 'Update'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  <div className="col-lg-4">
                    <ManageOutcome courseId={id} />
                    <div className="mt-3">
                      <ManageRequirement courseId={id} />
                      <EditCover

                      course={course}
                      setCourse={setCourse}
                      />
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

export default EditCourse;
