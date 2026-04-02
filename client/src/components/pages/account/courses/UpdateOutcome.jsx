import React, { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';

const UpdateOutcome = ({ show, value, loading, onClose, onSave }) => {
  const [text, setText] = useState('');

  useEffect(() => {
    setText(value || '');
  }, [value, show]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(text.trim());
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Update Outcome</Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="mb-2">
            <label htmlFor="outcomeText" className="form-label">
              Title
            </label>
            <input
              id="outcomeText"
              type="text"
              className="form-control"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Outcome"
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

export default UpdateOutcome;
