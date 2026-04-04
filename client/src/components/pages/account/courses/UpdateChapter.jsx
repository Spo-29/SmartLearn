import React, { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { useForm } from 'react-hook-form';
import { apiUrl } from '../../../../common/Config';
import toast from 'react-hot-toast';

const UpdateChapter = ({ chapterData, showChapter, handleClose, setChapters }) => {
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem('token');
    const { register, handleSubmit, formState: { errors }, reset } = useForm();

    // Sync form with chapterData when modal opens
    useEffect(() => {
        if (chapterData) {
            reset({
                chapter: chapterData.chapter_name || chapterData.chapter
            });
        }
    }, [chapterData, reset]);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            // Note: Using PUT/PATCH for updates is standard. 
            // If your API requires POST, change method back to 'POST'
            const res = await fetch(`${apiUrl}/chapters/${chapterData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (res.ok || result.status === 200) {
                // Update the global state in ManageChapter
                setChapters({ type: "UPDATE_CHAPTER", payload: result.data });
                
                toast.success(result.message || "Chapter updated successfully!");
                handleClose(); // Close modal on success
            } else {
                toast.error(result.message || "Something went wrong");
            }
        } catch (err) {
            toast.error("An error occurred while updating the chapter.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal size='lg' show={showChapter} onHide={handleClose} centered>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Header closeButton>
                    <Modal.Title className="h5">Update Chapter</Modal.Title>
                </Modal.Header>
                
                <Modal.Body>
                    <div className='mb-3'>
                        <label className='form-label fw-bold small'>Chapter Name</label>
                        <input
                            {...register('chapter', {
                                required: "The chapter name is required."
                            })}
                            type="text"
                            className={`form-control ${errors.chapter ? 'is-invalid' : ''}`}
                            placeholder="Enter chapter name"
                        />
                        {errors.chapter && (
                            <div className='invalid-feedback'>{errors.chapter.message}</div>
                        )}
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <button 
                        type="button" 
                        className="btn btn-light border" 
                        onClick={handleClose}
                    >
                        Cancel
                    </button>
                    <button
                        disabled={loading}
                        className='btn text-white'
                        style={{ backgroundColor: '#20c997' }}
                    >
                        {loading ? 'Please wait...' : 'Update Chapter'}
                    </button>
                </Modal.Footer>
            </form>
        </Modal>
    );
};

export default UpdateChapter;