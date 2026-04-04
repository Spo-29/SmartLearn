import React from 'react'
import { useForm } from 'react-hook-form';
import { apiUrl } from '../../../../common/Config';
import Accordion from 'react-bootstrap/Accordion';
const ManageChapter = (course,params) => {
  
  const { register, handleSubmit, formState: {errors}, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [chapterData, setChapterData] = useState();
const [showChapter, setShowChapter] = useState(false);
const handleClose = () => setShowOutcome(false);
const handleShow = (outcome) => {
    setShowChapter(true);
    setCapterData(outcome);
}
const chapterReducer = (state, action) => {

    switch (action.type) {
        case "SET_CHAPTERS":
            return action.payload;
        case "ADD_CHAPTER":
            return [...state, action.payload]
        case "UPDATE_CHAPTER":
            return state.map(chapter => {
                if (chapter.id === action.payload.id) {
                    return action.payload;
                }
            })

        case "DELETE_CHAPTER":
          return state.filter(chapter => chapter.id != action.payload)
        default:
            return state;
    }
}


const [chapters, setChapters] = useReducer(chapterReducer, []);


  const onSubmit = async (data) => { 

    setLoading(true)
    const formData = {...data, course_id: params.id}
    await fetch(`${apiUrl}/chapters`, {
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
        //const newOutcomes = [...outcomes, result.data]
        //setOutcomes(newOutcomes)
        setChapters({type: "ADD_CHAPTER", payload: result.data})
toast.success(result.message)
reset();
} else {
    console.log("Something went wrong")
}
});
  }  
  const DeleteChapter = async (data) => { 

   if (confirm("Are you sure you want to delete?")) {
   
    await fetch(`${apiUrl}/chapters/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-type' : 'application/json',
        'Accept' : 'application/json',
        'Authorization' : `Bearer ${token}`
      }
    
    })
    .then(res => res.json())
    .then(result => {
     
      if (result.status == 200) {
        //const newOutcomes = [...outcomes, result.data]
        //setOutcomes(newOutcomes)
       setChapters({type: "DELETE_CHAPTER", payload: id})
toast.success(result.message)

} else {
    console.log("Something went wrong")
}
});
  }  }

  useEffect(() => {
    if (course.chapters) {
        setChapters({type: "SET_CHAPTERS", payload: course.chapters})
    }
}, [course])
  return (
    <>
      <div className='card shadow-lg border-0 mt-4'>
        <div className='card-body p-4'>
          <div className="d-flex">
            <h4 className='h5 mb-3'>Chapter</h4>
          </div>
          <form className='mb-4' onSubmit={handleSubmit(onSubmit)}>
            <div className='mb-3'>
  <input
    {
      ...register("chapter", {
        required: "The chapter field is required."
      })
    }
    type="text"
    className={`form-control ${errors.chapter && 'is-invalid'}`}
    placeholder='chapter' />
  {
    errors.chapter && <p className='invalid-feedback'>{errors.chapter.message}</p>
  }
</div>
<button
  disabled={loading}
  className='btn btn-primary'> 
  { loading == false ? 'Save' : 'Please wait...' }
</button>

          </form>
          <Accordion >
            {chapters.map(chapter => {
            return(
  <Accordion.Item eventKey="index">
    <Accordion.Header>Accordion Item #1</Accordion.Header>
    <Accordion.Body>
      <div className='d-flex'>
  <button 
   onClick={() => DeleteChapter(chapter.id)}
  className='btn btn-danger btn-sm'>Delete Chapter</button>
  <button 
  onClick={() => handleShow()}
  className='btn btn-primary btn-sm ms-2'>Update Chapter</button>

</div>
    </Accordion.Body>
  </Accordion.Item>)
  })}
 
</Accordion>
        </div>
      </div> 
      <UpdateChapter
      chapterData={chapterData}
      showChapter={showChapter}
      handleClose={handleClose}
      setChapters={setChapters}
      />
    </>
  )
}

export default ManageChapter