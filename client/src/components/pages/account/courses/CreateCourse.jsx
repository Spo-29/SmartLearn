import React from 'react';
import Layout from '../../../common/Layout';
import { Link } from 'react-router-dom';
import UserSidebar from '../../../common/UserSidebar';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CreateCourse = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm({
    defaultValues: {
      title: '',
      status: 1,
      is_featured: 'no',
    },
  });

  const onSubmit = async (data) => {
    const rawUserInfo = localStorage.getItem('userInfoLms');

    if (!rawUserInfo) {
      toast.error('Please login first.');
      navigate('/account/login');
      return;
    }

    let token = null;
    try {
      token = JSON.parse(rawUserInfo)?.token;
    } catch (error) {
      token = null;
    }

    if (!token) {
      toast.error('Session expired. Please login again.');
      navigate('/account/login');
      return;
    }

    const payload = {
      title: data.title,
      status: 1,
      is_featured: 'no',
    };

    await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses`, {
      method: 'POST',
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
          toast.success('Course has been created successfully.');
          const courseId = result?.data?.id;

          if (courseId) {
            navigate(`/account/courses/edit/${courseId}`);
          } else {
            reset({
              title: '',
              status: 1,
              is_featured: 'no',
            });
            navigate('/account/my-courses');
          }
        } else if (result.errors) {
          Object.keys(result.errors).forEach((field) => {
            setError(field, {
              type: 'server',
              message: result.errors[field][0],
            });
          });
        } else {
          toast.error(result.message || 'Failed to create course.');
        }
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
                Create Course
              </li>
            </ol>
          </nav>
          <div className="row">
            <div className="col-md-12 mt-5 mb-3">
              <div className="d-flex justify-content-between">
                <h2 className="h4 mb-0 pb-0">Create Course</h2>
              </div>
            </div>
            <div className="col-lg-3 account-sidebar">
              <UserSidebar />
            </div>
            <div className="col-lg-9">
              <div className="row">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="card border-0 shadow-lg">
                    <div className="card-body p-4">
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
                      <button className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Continue'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CreateCourse;