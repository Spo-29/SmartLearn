import React, { useEffect, useState } from 'react';

const ReviewCommentList = ({ courseId }) => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:8000/api/courses/${courseId}/reviews`)
      .then((res) => res.json())
      .then((data) => {
        setReviews(data.reviews || []);
      });
  }, [courseId]);

  return (
    <div className="mt-4">
      <h4 className="mb-3">Comments</h4>

      {reviews.length === 0 && <p>No comments yet.</p>}

      {reviews.map((review) => (
        <div key={review.id} className="border rounded p-3 mb-3">
          <p className="mb-1">
            <strong>{review.user?.name || 'User'}</strong>
          </p>
          <p className="mb-0">{review.comment}</p>
        </div>
      ))}
    </div>
  );
};

export default ReviewCommentList;