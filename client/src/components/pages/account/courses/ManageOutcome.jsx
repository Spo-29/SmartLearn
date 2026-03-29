import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FaRegEdit, FaRegTrashAlt } from 'react-icons/fa';
import UpdateOutcome from './UpdateOutcome';

const ManageOutcome = ({ courseId }) => {
  const [newOutcome, setNewOutcome] = useState('');
  const [outcomes, setOutcomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingOutcome, setEditingOutcome] = useState(null);
  const [updating, setUpdating] = useState(false);

  const token = useMemo(() => {
    const rawUserInfo = localStorage.getItem('userInfoLms');
    if (!rawUserInfo) {
      return null;
    }

    try {
      return JSON.parse(rawUserInfo)?.token || null;
    } catch (error) {
      return null;
    }
  }, []);

  const fetchOutcomes = async () => {
    if (!token) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/${courseId}/outcomes`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (result.status === 200) {
        setOutcomes(result.data || []);
      } else {
        toast.error(result.message || 'Failed to load outcomes.');
      }
    } catch (error) {
      toast.error('Failed to load outcomes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutcomes();
  }, [courseId]);

  const handleStore = async (event) => {
    event.preventDefault();

    if (!newOutcome.trim()) {
      toast.error('Outcome is required.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/${courseId}/outcomes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: newOutcome.trim() }),
        },
      );

      const result = await response.json();

      if (result.status === 200) {
        setNewOutcome('');
        setOutcomes((prev) => [...prev, result.data]);
        toast.success(result.message || 'Outcome saved successfully.');
      } else if (result.errors?.text?.[0]) {
        toast.error(result.errors.text[0]);
      } else {
        toast.error(result.message || 'Failed to save outcome.');
      }
    } catch (error) {
      toast.error('Failed to save outcome.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (outcomeId) => {
    setDeletingId(outcomeId);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/outcomes/${outcomeId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.status === 200) {
        setOutcomes((prev) => prev.filter((item) => item.id !== outcomeId));
        toast.success(result.message || 'Outcome deleted successfully.');
      } else {
        toast.error(result.message || 'Failed to delete outcome.');
      }
    } catch (error) {
      toast.error('Failed to delete outcome.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdate = async (text) => {
    if (!editingOutcome?.id) {
      return;
    }

    if (!text) {
      toast.error('Outcome is required.');
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/outcomes/${editingOutcome.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text }),
        },
      );

      const result = await response.json();

      if (result.status === 200) {
        setOutcomes((prev) => prev.map((item) => (item.id === result.data.id ? result.data : item)));
        setEditingOutcome(null);
        toast.success(result.message || 'Outcome updated successfully.');
      } else if (result.errors?.text?.[0]) {
        toast.error(result.errors.text[0]);
      } else {
        toast.error(result.message || 'Failed to update outcome.');
      }
    } catch (error) {
      toast.error('Failed to update outcome.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="card border-0 shadow-lg">
      <div className="card-body p-4">
        <h3 className="h5">Outcome</h3>
        <form onSubmit={handleStore}>
          <div className="mb-3">
            <textarea
              className="form-control"
              rows="2"
              placeholder="Outcome"
              value={newOutcome}
              onChange={(event) => setNewOutcome(event.target.value)}
              maxLength={255}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>

        <div className="mt-3">
          {loading ? (
            <p className="mb-0 text-muted">Loading outcomes...</p>
          ) : outcomes.length === 0 ? (
            <p className="mb-0 text-muted">No outcomes added yet.</p>
          ) : (
            outcomes.map((outcome) => (
              <div key={outcome.id} className="card mb-2 border-0 bg-light">
                <div className="card-body py-2 px-3 d-flex align-items-center justify-content-between gap-3">
                  <div className="d-flex align-items-start gap-2 flex-grow-1">
                    <span className="text-muted">::</span>
                    <span className="small mb-0">{outcome.text}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-link p-0 text-primary"
                      onClick={() => setEditingOutcome(outcome)}
                      title="Update"
                    >
                      <FaRegEdit />
                    </button>
                    <button
                      type="button"
                      className="btn btn-link p-0 text-danger"
                      onClick={() => handleDelete(outcome.id)}
                      disabled={deletingId === outcome.id}
                      title="Delete"
                    >
                      <FaRegTrashAlt />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <UpdateOutcome
        show={Boolean(editingOutcome)}
        value={editingOutcome?.text || ''}
        loading={updating}
        onClose={() => setEditingOutcome(null)}
        onSave={handleUpdate}
      />
    </div>
  );
};

export default ManageOutcome;
