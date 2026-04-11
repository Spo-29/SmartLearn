import React, { useEffect, useState } from 'react';
import Course from './Course';

const FeaturedCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    const fetchFeaturedCourses = async () => {
      setLoading(true);

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/fetch-featured-courses`, {
          headers: {
            Accept: 'application/json',
          },
        });

        const result = await response.json();

        if (result.status === 200 && Array.isArray(result.data)) {
          const publishedCourses = result.data.filter((course) => Number(course.status) === 1);
          setCourses(publishedCourses);
        } else {
          setCourses([]);
        }
        
      } catch {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCourses();
  }, []);

  return (
    <section className="section-3 my-5">
      <div className="container">
        <div className="section-title py-3  mt-4">
          <h2 className="h3">Featured Courses</h2>
          <p>Discover courses designed to help you excel in your professional and personal growth.</p>
        </div>
        <div className="row gy-4">
          {loading ? (
            <p className="text-muted mb-0">Loading featured courses...</p>
          ) : courses.length ? (
            courses.map((course) => <Course key={course.id} course={course} customClasses="col-lg-3 col-md-6" />)
          ) : (
            <p className="text-muted mb-0">No featured courses available right now.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCourses;
