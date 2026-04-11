import React, { useState } from 'react';
import toast from 'react-hot-toast';

const ReviewCommentForm = ({ courseId }) => {
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);

  const submitComment = async (e) => {
    e.preventDefault();

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        course_id: courseId,
        comment,
        rating,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      toast.success(data.message || 'Review submitted successfully');
      setComment('');
      setRating(5);
    } else {
      toast.error(data.message || 'Failed to submit review');
    }
  };

  return (
    <form onSubmit={submitComment} className="mt-4">
      <h4 className="mb-3">Write a Review</h4>

      <div className="mb-3">
        <label className="form-label">Comment</label>
        <textarea
          className="form-control"
          rows="4"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write your comment"
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Rating</label>
        <select
          className="form-control"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        >
          <option value={1}>1 Star</option>
          <option value={2}>2 Stars</option>
          <option value={3}>3 Stars</option>
          <option value={4}>4 Stars</option>
          <option value={5}>5 Stars</option>
        </select>
      </div>

      <button className="btn btn-primary">Submit Review</button>
    </form>
  );
};

export default ReviewCommentForm;