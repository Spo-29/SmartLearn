import React, { useEffect, useMemo } from 'react';
import Layout from '../../common/Layout';
import { Link, useNavigate } from 'react-router-dom';
import UserSidebar from '../../common/UserSidebar';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const MyAccount = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const token = useMemo(() => {
    const rawUserInfo = localStorage.getItem('userInfoLms');

    if (!rawUserInfo) {
      return null;
    }

    try {
      return JSON.parse(rawUserInfo)?.token || null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!token) {
      navigate('/account/login');
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/account/profile`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (result.status === 200) {
          reset({
            name: result.data?.name || '',
            email: result.data?.email || '',
          });
        } else {
          toast.error(result.message || 'Failed to load profile.');
        }
      } catch {
        toast.error('Failed to load profile.');
      }
    };

    loadProfile();
  }, [navigate, reset, token]);

  const onSubmit = async (data) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/account/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.status === 200) {
        const rawUserInfo = localStorage.getItem('userInfoLms');

        if (rawUserInfo) {
          try {
            const userInfo = JSON.parse(rawUserInfo);
            userInfo.name = result.data?.name || userInfo.name;
            localStorage.setItem('userInfoLms', JSON.stringify(userInfo));
          } catch {
            // no-op
          }
        }

        toast.success(result.message || 'Profile updated successfully.');
      } else if (result.errors) {
        Object.keys(result.errors).forEach((field) => {
          setError(field, {
            type: 'server',
            message: result.errors[field][0],
          });
        });
      } else {
        toast.error(result.message || 'Failed to update profile.');
      }
    } catch {
      toast.error('Failed to update profile.');
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
              <li className="breadcrumb-item active" aria-current="page">
                Profile
              </li>
            </ol>
          </nav>

          <div className="row">
            <div className="col-md-12 mt-5 mb-3">
              <h2 className="h4 mb-0 pb-0">Profile</h2>
            </div>

            <div className="col-lg-3 account-sidebar">
              <UserSidebar />
            </div>

            <div className="col-lg-9">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="card border-0 shadow-lg">
                  <div className="card-body p-4">
                    <div className="mb-3">
                      <label htmlFor="name">Name</label>
                      <input
                        id="name"
                        type="text"
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                        {...register('name', {
                          required: 'Name is required.',
                        })}
                      />
                      {errors.name && <p className="invalid-feedback">{errors.name.message}</p>}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="email">Email</label>
                      <input
                        id="email"
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        {...register('email', {
                          required: 'Email is required.',
                        })}
                      />
                      {errors.email && <p className="invalid-feedback">{errors.email.message}</p>}
                    </div>

                    <button className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? 'Updating...' : 'Update'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default MyAccount;
