import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Accordion, Card, ListGroup } from 'react-bootstrap';
import Layout from '../common/Layout';
import { convertMinutesToHours } from '../../utils/convertMinutesToHours';

const Detail = () => {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);

  useEffect(() => {
    if (!id) {
      setCourse(null);
      setLoading(false);
      return;
    }

    const fetchCourse = async () => {
      setLoading(true);

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/fetch-course/${id}`, {
          headers: {
            Accept: 'application/json',
          },
        });

        const result = await response.json();

        if (result.status === 200) {
          setCourse(result.data || null);
        } else {
          setCourse(null);
        }
      } catch {
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const totalChapters = Number(course?.chapters_count || 0);
  const totalLessons = Number(course?.lessons_count || 0);
  const totalDuration = convertMinutesToHours(Number(course?.lessons_duration_sum || 0));

  return (
    <Layout>
      <div className="container pb-5 pt-3">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/home">Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link to="/courses">Courses</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {course?.title || 'Course Details'}
            </li>
          </ol>
        </nav>

        {loading ? (
          <div className="border bg-white rounded-3 p-4 mt-4">
            <p className="mb-0">Loading course details...</p>
          </div>
        ) : !course ? (
          <div className="border bg-white rounded-3 p-4 mt-4">
            <h2 className="h4">Course not found</h2>
            <p className="mb-0 text-muted">The selected course is unavailable right now.</p>
          </div>
        ) : (
          <div className="row my-5">
            <div className="col-lg-8">
              <h2>{course.title}</h2>
              <div className="d-flex gap-3 flex-wrap mt-3">
                <span className="badge bg-green">{course.category?.name || 'Category N/A'}</span>
                <span className="text-muted">Level: {course.level?.name || 'N/A'}</span>
                <span className="text-muted">Language: {course.language?.name || 'N/A'}</span>
              </div>

              <div className="row mt-4">
                <div className="col-md-4">
                  <span className="text-muted d-block">Total Chapters</span>
                  <span className="fw-bold">{totalChapters}</span>
                </div>
                <div className="col-md-4">
                  <span className="text-muted d-block">Total Lessons</span>
                  <span className="fw-bold">{totalLessons}</span>
                </div>
                <div className="col-md-4">
                  <span className="text-muted d-block">Course Length</span>
                  <span className="fw-bold">{totalDuration}</span>
                </div>
              </div>

              <div className="row">
                <div className="col-md-12 mt-4">
                  <div className="border bg-white rounded-3 p-4">
                    <h3 className="mb-3  h4">Overview</h3>
                    <p className="mb-0">{course.description || 'No description available.'}</p>
                  </div>
                </div>

                <div className="col-md-12 mt-4">
                  <div className="border bg-white rounded-3 p-4">
                    <h3 className="mb-3 h4">What You Will Learn</h3>
                    {(course.outcomes || []).length ? (
                      <ul className="list-unstyled mt-3 mb-0">
                        {(course.outcomes || []).map((outcome) => (
                          <li className="d-flex align-items-center mb-2" key={outcome.id}>
                            <span className="text-success me-2">&#10003;</span>
                            <span>{outcome.text}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mb-0 text-muted">No outcomes added yet.</p>
                    )}
                  </div>
                </div>

                <div className="col-md-12 mt-4">
                  <div className="border bg-white rounded-3 p-4">
                    <h3 className="mb-3 h4">Requirements</h3>
                    {(course.requirements || []).length ? (
                      <ul className="list-unstyled mt-3 mb-0">
                        {(course.requirements || []).map((requirement) => (
                          <li className="d-flex align-items-center mb-2" key={requirement.id}>
                            <span className="text-success me-2">&#10003;</span>
                            <span>{requirement.text}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mb-0 text-muted">No requirements added yet.</p>
                    )}
                  </div>
                </div>

                <div className="col-md-12 mt-4">
                  <div className="border bg-white rounded-3 p-4">
                    <h3 className="h4 mb-3">Course Structure</h3>
                    {(course.chapters || []).length ? (
                      <Accordion>
                        {(course.chapters || []).map((chapter) => (
                          <Accordion.Item eventKey={String(chapter.id)} key={chapter.id}>
                            <Accordion.Header>
                              {chapter.title}
                              <span className="ms-2 text-muted">({(chapter.lessons || []).length} lessons)</span>
                            </Accordion.Header>
                            <Accordion.Body>
                              {(chapter.lessons || []).length ? (
                                <ListGroup>
                                  {(chapter.lessons || []).map((lesson) => (
                                    <ListGroup.Item
                                      as={Link}
                                      action
                                      key={lesson.id}
                                      to={`/detail/${id}/lessons/${lesson.id}`}
                                      state={{ from: `/detail/${id}` }}
                                    >
                                      {lesson.title}
                                    </ListGroup.Item>
                                  ))}
                                </ListGroup>
                              ) : (
                                <p className="mb-0 text-muted">No lessons in this chapter.</p>
                              )}
                            </Accordion.Body>
                          </Accordion.Item>
                        ))}
                      </Accordion>
                    ) : (
                      <p className="mb-0 text-muted">No chapters added yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="border rounded-3 bg-white p-4 shadow-sm">
                <Card.Body>
                  <h3 className="fw-bold">${course.price !== null && course.price !== undefined ? Number(course.price).toFixed(2) : '0.00'}</h3>
                  {course.cross_price !== null && course.cross_price !== undefined ? (
                    <div className="text-muted text-decoration-line-through">${Number(course.cross_price).toFixed(2)}</div>
                  ) : null}
                </Card.Body>
                <Card.Footer className="mt-4">
                  <h6 className="fw-bold">This course includes</h6>
                  <ListGroup variant="flush">
                    <ListGroup.Item className="ps-0">{totalChapters} chapters</ListGroup.Item>
                    <ListGroup.Item className="ps-0">{totalLessons} lessons</ListGroup.Item>
                    <ListGroup.Item className="ps-0">{totalDuration} total course length</ListGroup.Item>
                  </ListGroup>
                </Card.Footer>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Detail;
