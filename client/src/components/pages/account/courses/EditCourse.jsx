import React from 'react';
import Layout from '../../../common/Layout';
import { Link, useParams } from 'react-router-dom';
import UserSidebar from '../../../common/UserSidebar';

const EditCourse = () => {
  const { id } = useParams();

  return (
    <Layout>
      <section className="section-4">
        <div className="container pb-5 pt-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/account/dashboard">Account</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/account/my-courses">My Courses</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Edit Course
              </li>
            </ol>
          </nav>

          <div className="row">
            <div className="col-md-12 mt-5 mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <h2 className="h4 mb-0 pb-0">Edit Course</h2>
                <span className="text-muted">Course ID: {id}</span>
              </div>
            </div>

            <div className="col-lg-3 account-sidebar">
              <UserSidebar />
            </div>

            <div className="col-lg-9">
              <div className="card border-0 shadow-lg">
                <div className="card-body p-4">
                  <p className="mb-0">Course created successfully. You are now on the edit page.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default EditCourse;
