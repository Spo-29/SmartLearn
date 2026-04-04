import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import {
  DndContext, 
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- This handles the individual lesson row inside the modal ---
const SortableLessonItem = ({ lesson }) => {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Ensure the dragging item stays on top of others
    zIndex: isDragging ? 1100 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`bg-white p-3 mb-2 rounded border shadow-sm cursor-move d-flex align-items-center ${isDragging ? 'border-primary shadow' : ''}`}
    >
      <span className="small fw-medium text-dark">{lesson.title || lesson.name}</span>
    </div>
  );
};

// --- This is the Modal Component ---
const LessonSort = ({ show, handleClose, initialLessons, onSortEnd }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (initialLessons) setItems(initialLessons);
  }, [initialLessons]);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      const newOrder = arrayMove(items, oldIndex, newIndex);
      setItems(newOrder);
      
      // Send the updated array back to the parent component
      onSortEnd(newOrder);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="h6 fw-bold">Sort Lessons</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-light p-4 pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={items.map(i => i.id)} 
            strategy={verticalListSortingStrategy}
          >
            {items.map((lesson) => (
              <SortableLessonItem key={lesson.id} lesson={lesson} />
            ))}
          </SortableContext>
        </DndContext>
      </Modal.Body>
    </Modal>
  );
};

export default LessonSort;