import React, { useState } from 'react';
import toast from 'react-hot-toast';

const ReviewCommentForm = ({ courseId }) => {
  const [comment, setComment] = useState('');

  const submitComment = async (e) => {
    e.preventDefault();

    const res = await fetch('http://localhost:8000/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        course_id: courseId,
        comment: comment,
      }),
    });

    const data = await res.json();

    if (data.status === 200) {
      toast.success('Comment submitted successfully');
      setComment('');
    } else {
      toast.error(data.message || 'Failed to submit comment');
    }
  };

  return (
    <form onSubmit={submitComment} className="mt-4">
      <h4 className="mb-3">Write a Comment</h4>

      <div className="mb-3">
        <textarea
          className="form-control"
          rows="4"
          placeholder="Write your comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <button className="btn btn-primary">Submit Comment</button>
    </form>
  );
};

export default ReviewCommentForm;