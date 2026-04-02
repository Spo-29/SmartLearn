import React, { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';

const UpdateChapter = ({ show, value, loading, onClose, onSave }) => {
  const [title, setTitle] = useState('');

  useEffect(() => {
    setTitle(value || '');
  }, [value, show]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(title.trim());
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Update Chapter</Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="mb-2">
            <label htmlFor="chapterTitle" className="form-label">
              Chapter
            </label>
            <input
              id="chapterTitle"
              type="text"
              className="form-control"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Chapter"
              maxLength={255}
            />
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-content-start">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default UpdateChapter;
