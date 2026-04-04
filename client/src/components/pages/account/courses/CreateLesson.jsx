import React, { useState } from 'react'
import Modal from 'react-bootstrap/Modal';
import { useForm } from 'react-hook-form';
import { apiUrl, token } from '../../../../common/Config';
import toast from 'react-hot-toast';

const CreateLesson = ({ showLessonModal, handleCloseLessonModal, course }) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmit = async (data) => { 
    setLoading(true);
    const formData = { ...data, course_id: course.id };

    try {
      const response = await fetch(`${apiUrl}/chapters/${data.chapter}`, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      setLoading(false);

      if (result.status === 200) {
        toast.success(result.message);
        reset();
      } else {
        toast.error(result.message || "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
      toast.error("An error occurred. Please try again.");
    }
  }

  return (
    <>
      <Modal size='lg' show={showLessonModal} onHide={handleCloseLessonModal}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Header closeButton>
            <Modal.Title>Create Lesson</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Chapter Dropdown */}
            <div className='mb-3'>
              <label className='form-label'>Chapter</label>
              <select
                {...register('chapter', { required: "The chapter field is required." })}
                className={`form-control ${errors.chapter ? 'is-invalid' : ''}`}
              >
                <option value="">Select a chapter</option>
                {course.chapters && course.chapters.map(chapter => (
                  <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
                ))}
              </select>
              {errors.chapter && <p className='invalid-feedback'>{errors.chapter.message}</p>}
            </div>

            {/* Lesson Input */}
            <div className='mb-3'>
              <label className='form-label'>Lesson</label>
              <input
                {...register('lesson', { required: "The lesson field is required." })}
                type="text"
                className={`form-control ${errors.lesson ? 'is-invalid' : ''}`}
                placeholder="Lesson"
              />
              {errors.lesson && <p className='invalid-feedback'>{errors.lesson.message}</p>}
            </div>

            {/* Status Dropdown */}
            <div className='mb-3'>
              <label className='form-label'>Status</label>
              <select
                {...register('status', { required: "The status field is required." })}
                className={`form-control ${errors.status ? 'is-invalid' : ''}`}
              >
                <option value="">Select status</option>
                <option value="active">Active</option>
                <option value="block">Block</option>
              </select>
              {errors.status && <p className='invalid-feedback'>{errors.status.message}</p>}
            </div>

          </Modal.Body>
          <Modal.Footer>
            <button disabled={loading} className='btn btn-primary'>
              {loading ? 'Please wait...' : 'Save'}
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  )
}

export default CreateLesson;