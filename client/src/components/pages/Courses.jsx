import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../common/Layout';
import Course from '../common/Course';

const parseCsvParam = (value) => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
};

const parseSingleCsvParam = (value) => {
  const ids = parseCsvParam(value);
  return ids.length ? [ids[0]] : [];
};

const buildSearchParams = ({ keyword, categories, levels, languages, sort }) => {
  const params = new URLSearchParams();

  if (keyword.trim()) {
    params.set('keyword', keyword.trim());
  }

  if (categories.length) {
    params.set('category', categories.join(','));
  }

  if (levels.length) {
    params.set('level', levels.join(','));
  }

  if (languages.length) {
    params.set('language', languages.join(','));
  }

  params.set('sort', sort);

  return params;
};

const Courses = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [keyword, setKeyword] = useState(() => searchParams.get('keyword') || '');
  const [categoryChecked, setCategoryChecked] = useState(() => parseSingleCsvParam(searchParams.get('category')));
  const [levelChecked, setLevelChecked] = useState(() => parseSingleCsvParam(searchParams.get('level')));
  const [languageChecked, setLanguageChecked] = useState(() => parseSingleCsvParam(searchParams.get('language')));
  const [sortBy, setSortBy] = useState(() => (searchParams.get('sort') === 'asc' ? 'asc' : 'desc'));

  const [meta, setMeta] = useState({
    categories: [],
    levels: [],
    languages: [],
  });
  const [courses, setCourses] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);

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

  const categoryKey = categoryChecked.join(',');
  const levelKey = levelChecked.join(',');
  const languageKey = languageChecked.join(',');

  useEffect(() => {
    const nextKeyword = searchParams.get('keyword') || '';
    const nextCategoryChecked = parseSingleCsvParam(searchParams.get('category'));
    const nextLevelChecked = parseSingleCsvParam(searchParams.get('level'));
    const nextLanguageChecked = parseSingleCsvParam(searchParams.get('language'));
    const nextSortBy = searchParams.get('sort') === 'asc' ? 'asc' : 'desc';

    const nextCategoryKey = nextCategoryChecked.join(',');
    const nextLevelKey = nextLevelChecked.join(',');
    const nextLanguageKey = nextLanguageChecked.join(',');

    setKeyword((prev) => (prev === nextKeyword ? prev : nextKeyword));
    setCategoryChecked((prev) => (prev.join(',') === nextCategoryKey ? prev : nextCategoryChecked));
    setLevelChecked((prev) => (prev.join(',') === nextLevelKey ? prev : nextLevelChecked));
    setLanguageChecked((prev) => (prev.join(',') === nextLanguageKey ? prev : nextLanguageChecked));
    setSortBy((prev) => (prev === nextSortBy ? prev : nextSortBy));
  }, [searchParams]);

  useEffect(() => {
    if (!token) {
      toast.error('Please login first.');
      navigate('/account/login');
      return;
    }

    const fetchMeta = async () => {
      setLoadingMeta(true);

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/meta`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (result.status === 200) {
          setMeta({
            categories: result.categories || [],
            levels: result.levels || [],
            languages: result.languages || [],
          });
          return;
        }

        toast.error(result.message || 'Failed to load course filters.');
      } catch {
        toast.error('Failed to load course filters.');
      } finally {
        setLoadingMeta(false);
      }
    };

    fetchMeta();
  }, [token, navigate]);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);

      const params = buildSearchParams({
        keyword,
        categories: categoryChecked,
        levels: levelChecked,
        languages: languageChecked,
        sort: sortBy,
      });

      setSearchParams(params, { replace: true });

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/fetch-courses?${params.toString()}`, {
          headers: {
            Accept: 'application/json',
          },
        });

        const result = await response.json();

        if (result.status === 200 && Array.isArray(result.data)) {
          setCourses(result.data);
        } else {
          setCourses([]);
        }
      } catch {
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [keyword, categoryKey, levelKey, languageKey, sortBy, setSearchParams]);

  const handleCategoryToggle = (value) => {
    if (categoryChecked.includes(value)) {
      setCategoryChecked([]);
      return;
    }

    setCategoryChecked([value]);
  };

  const handleLevelToggle = (value) => {
    if (levelChecked.includes(value)) {
      setLevelChecked([]);
      return;
    }

    setLevelChecked([value]);
  };

  const handleLanguageToggle = (value) => {
    if (languageChecked.includes(value)) {
      setLanguageChecked([]);
      return;
    }

    setLanguageChecked([value]);
  };

  const handleClearFilters = () => {
    setKeyword('');
    setCategoryChecked([]);
    setLevelChecked([]);
    setLanguageChecked([]);
    setSortBy('desc');
  };

  return (
    <Layout>
      <div className="container pb-5 pt-3">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/home">Home</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Courses
            </li>
          </ol>
        </nav>
        <div className="row">
          <div className="col-lg-3">
            <div className="sidebar mb-5 card border-0">
              <div className="card-body shadow">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by keyword"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />

                <div className="pt-3">
                  <h3 className="h5 mb-2">Category</h3>
                  {loadingMeta ? (
                    <p className="small text-muted mb-0">Loading categories...</p>
                  ) : (
                    <ul>
                      {meta.categories.map((category) => {
                        const value = String(category.id);
                        const inputId = `category-${category.id}`;

                        return (
                          <li key={category.id}>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={inputId}
                                checked={categoryChecked.includes(value)}
                                onChange={() => handleCategoryToggle(value)}
                              />
                              <label className="form-check-label" htmlFor={inputId}>
                                {category.name}
                              </label>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="mb-3">
                  <h3 className="h5  mb-2">Level</h3>
                  {loadingMeta ? (
                    <p className="small text-muted mb-0">Loading levels...</p>
                  ) : (
                    <ul>
                      {meta.levels.map((level) => {
                        const value = String(level.id);
                        const inputId = `level-${level.id}`;

                        return (
                          <li key={level.id}>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={inputId}
                                checked={levelChecked.includes(value)}
                                onChange={() => handleLevelToggle(value)}
                              />
                              <label className="form-check-label" htmlFor={inputId}>
                                {level.name}
                              </label>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="mb-3">
                  <h3 className="h5 mb-2">Language</h3>
                  {loadingMeta ? (
                    <p className="small text-muted mb-0">Loading languages...</p>
                  ) : (
                    <ul>
                      {meta.languages.map((language) => {
                        const value = String(language.id);
                        const inputId = `language-${language.id}`;

                        return (
                          <li key={language.id}>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={inputId}
                                checked={languageChecked.includes(value)}
                                onChange={() => handleLanguageToggle(value)}
                              />
                              <label className="form-check-label" htmlFor={inputId}>
                                {language.name}
                              </label>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <button type="button" className="btn btn-link clear-filter p-0" onClick={handleClearFilters}>
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
          <div className="col-lg-9">
            <section className="section-3">
              <div className="d-flex justify-content-between mb-3 align-items-center">
                <div className="h5 mb-0">{loadingCourses ? 'Loading courses...' : `${courses.length} courses found`}</div>
                <div>
                  <select className="form-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>
              <div className="row gy-4">
                {loadingCourses ? (
                  <p className="text-muted mb-0">Please wait while courses are loading...</p>
                ) : courses.length ? (
                  courses.map((course) => (
                    <Course key={course.id} course={course} customClasses="col-lg-4 col-md-6" />
                  ))
                ) : (
                  <p className="text-muted mb-0">No courses matched your filters.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Courses;
