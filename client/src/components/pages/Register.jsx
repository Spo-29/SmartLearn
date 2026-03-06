import React from 'react';
import Layout from '../common/Layout';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const {
    handleSubmit,
    register,
    formState: { errors },
    setError,
  } = useForm();

  const onSubmit = async (data) => {
    await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 200) {
          toast.success('Registration successful. Please login to continue.');
          navigate('/account/login');
        } else if (data.errors) {
          Object.keys(data.errors).forEach((field) => {
            setError(field, {
              type: 'server',
              message: data.errors[field][0],
            });
          });
        } else {
          toast.error('Registration failed. Please try again.');
        }
      });
  };

  return (
    <Layout>
      <div className="container py-5 mt-5">
        <div className="d-flex align-items-center justify-content-center">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="card border-0 shadow register">
              <div className="card-body p-4">
                <h3 className="border-bottom pb-3 mb-3">Register</h3>

                <div className="mb-3">
                  <label className="form-label" htmlFor="name">
                    Name
                  </label>
                  <input
                    {...register('name', {
                      required: 'Name is required',
                    })}
                    type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    placeholder="Name"
                  />
                  {errors.name && <div className="text-danger">{errors.name.message}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="email">
                    Email
                  </label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    type="text"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="Email"
                  />
                  {errors.email && <div className="text-danger">{errors.email.message}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="password">
                    Password
                  </label>
                  <input
                    {...register('password', {
                      required: 'Password is required',
                    })}
                    type="password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    placeholder="Password"
                  />
                  {errors.password && <div className="text-danger">{errors.password.message}</div>}
                </div>

                <div>
                  <button className="btn btn-primary w-100">Register</button>
                </div>

                <div className="d-flex justify-content-center py-3">
                  Already have account? &nbsp;
                  <Link className="text-secondary" to={`/account/login`}>
                    {' '}
                    Login
                  </Link>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
