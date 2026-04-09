import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const FeaturedCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/categories`, {
          headers: {
            Accept: 'application/json',
          },
        });

        const result = await response.json();

        if (Array.isArray(result)) {
          setCategories(result);
        } else if (Array.isArray(result?.value)) {
          setCategories(result.value);
        } else {
          setCategories([]);
        }
      } catch {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <section className="section-2">
      <div className="container">
        <div className="section-title py-3  mt-4">
          <h2 className="h3">Explore Categories</h2>
          <p>Discover categories designed to help you excel in your professional and personal growth.</p>
        </div>

        {loading ? (
          <p className="text-muted">Loading categories...</p>
        ) : categories.length ? (
          <div className="row gy-3">
            {categories.map((category) => (
              <div className="col-6 col-md-6 col-lg-3" key={category.id}>
                <div className="card shadow border-0">
                  <div className="card-body">
                    <Link to={`/courses?category=${category.id}&sort=desc`} className="text-decoration-none">
                      {category.name}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">No categories available right now.</p>
        )}
      </div>
    </section>
  );
};

export default FeaturedCategories;
