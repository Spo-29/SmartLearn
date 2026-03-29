import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FaRegEdit, FaRegTrashAlt } from 'react-icons/fa';
import UpdateRequirement from './UpdateRequirement';

const ManageRequirement = ({ courseId }) => {
  const [newRequirement, setNewRequirement] = useState('');
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingRequirement, setEditingRequirement] = useState(null);
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

  const fetchRequirements = async () => {
    if (!token) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/${courseId}/requirements`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (result.status === 200) {
        setRequirements(result.data || []);
      } else {
        toast.error(result.message || 'Failed to load requirements.');
      }
    } catch (error) {
      toast.error('Failed to load requirements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, [courseId]);

  const handleStore = async (event) => {
    event.preventDefault();

    if (!newRequirement.trim()) {
      toast.error('Requirement is required.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/${courseId}/requirements`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: newRequirement.trim() }),
        },
      );

      const result = await response.json();

      if (result.status === 200) {
        setNewRequirement('');
        setRequirements((prev) => [...prev, result.data]);
        toast.success(result.message || 'Requirement saved successfully.');
      } else if (result.errors?.text?.[0]) {
        toast.error(result.errors.text[0]);
      } else {
        toast.error(result.message || 'Failed to save requirement.');
      }
    } catch (error) {
      toast.error('Failed to save requirement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (requirementId) => {
    setDeletingId(requirementId);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/requirements/${requirementId}`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (result.status === 200) {
        setRequirements((prev) => prev.filter((item) => item.id !== requirementId));
        toast.success(result.message || 'Requirement deleted successfully.');
      } else {
        toast.error(result.message || 'Failed to delete requirement.');
      }
    } catch (error) {
      toast.error('Failed to delete requirement.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdate = async (text) => {
    if (!editingRequirement?.id) {
      return;
    }

    if (!text) {
      toast.error('Requirement is required.');
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/requirements/${editingRequirement.id}`,
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
        setRequirements((prev) => prev.map((item) => (item.id === result.data.id ? result.data : item)));
        setEditingRequirement(null);
        toast.success(result.message || 'Requirement updated successfully.');
      } else if (result.errors?.text?.[0]) {
        toast.error(result.errors.text[0]);
      } else {
        toast.error(result.message || 'Failed to update requirement.');
      }
    } catch (error) {
      toast.error('Failed to update requirement.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="card border-0 shadow-lg">
      <div className="card-body p-4">
        <h3 className="h5">Requirements</h3>
        <form onSubmit={handleStore}>
          <div className="mb-3">
            <textarea
              className="form-control"
              rows="2"
              placeholder="Requirement"
              value={newRequirement}
              onChange={(event) => setNewRequirement(event.target.value)}
              maxLength={255}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>

        <div className="mt-3">
          {loading ? (
            <p className="mb-0 text-muted">Loading requirements...</p>
          ) : requirements.length === 0 ? (
            <p className="mb-0 text-muted">No requirements added yet.</p>
          ) : (
            requirements.map((requirement) => (
              <div key={requirement.id} className="card mb-2 border-0 bg-light">
                <div className="card-body py-2 px-3 d-flex align-items-center justify-content-between gap-3">
                  <div className="d-flex align-items-start gap-2 flex-grow-1">
                    <span className="text-muted">::</span>
                    <span className="small mb-0">{requirement.text}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-link p-0 text-primary"
                      onClick={() => setEditingRequirement(requirement)}
                      title="Update"
                    >
                      <FaRegEdit />
                    </button>
                    <button
                      type="button"
                      className="btn btn-link p-0 text-danger"
                      onClick={() => handleDelete(requirement.id)}
                      disabled={deletingId === requirement.id}
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

      <UpdateRequirement
        show={Boolean(editingRequirement)}
        value={editingRequirement?.text || ''}
        loading={updating}
        onClose={() => setEditingRequirement(null)}
        onSave={handleUpdate}
      />
    </div>
  );
};

export default ManageRequirement;
