import React from 'react'
import React, { useEffect, useState } from 'react'
import Modal from 'react-bootstrap/Modal';
import { useForm } from 'react-hook-form';
import { apiUrl, token } from '../../../../common/Config';
import toast from 'react-hot-toast';

const UpdateChapter = ({chapterData,showChapter, handleClose,setChapters}) => { 
  const [loading, setLoading] = useState(false);
const { register, handleSubmit, formState: {errors}, reset } = useForm();
const [chapterData, setChapterData] = useState();

const onSubmit = async (data) => { 

    setLoading(true)
    const formData = {...data, course_id: params.id}
    await fetch(`${apiUrl}/chapters/${outcomeData.id}`, {
      method: 'POST',
      headers: {
        'Content-type' : 'application/json',
        'Accept' : 'application/json',
        'Authorization' : `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    })
    .then(res => res.json())
    .then(result => {
      setLoading(false)
      if (result.status == 200) {
        setChapters({type: "UPDATE_CHAPTER", payload: result.data})
       
toast.success(result.message)
reset();
} else {
    console.log("Something went wrong")
}
});
  } 
  useEffect(() => {
    if (chapterData) {
        reset({
            chapter: chapterData.title
        })
    }
}, [chapterData])
  return (
    <>
      <Modal size='lg' show={showChapter} onHide={handleClose}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Header closeButton>
            <Modal.Title>Update Chapter</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className='mb-3'>
              <label htmlFor="" className='form-label'>
                Chapter
              </label>
              <input
                {
                  ...register('outcome', {
                    required: "The outcome field is required."
                  })
                }
                type="text"
                className={`form-control ${errors.chapter && 'is-invalid'}`} 

placeholder="chapter"/>
              {
  errors.outcome && <p className='invalid-feedback'>{errors.chapter.message}</p>
}
</div>
</Modal.Body>
<Modal.Footer>
  <button
    disabled={loading}
    className='btn btn-primary'>
      { loading == false ? 'Save' : 'Please wait...' }
</button>
</Modal.Footer>
</form>
</Modal>
</>
)
 }

export default UpdateOutcome
