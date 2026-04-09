import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';

const ChapterSort = ({ show, chapters, loading, onClose, onSave }) => {
  const [items, setItems] = useState(chapters || []);

  const handleDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    if (result.destination.index === result.source.index) {
      return;
    }

    const reordered = [...items];
    const [movedItem] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, movedItem);
    setItems(reordered);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (items.length < 2) {
      onClose();
      return;
    }

    await onSave(items);
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      onShow={() => setItems(chapters || [])}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Reorder Chapters</Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          {items.length < 2 ? (
            <p className="text-muted mb-0">Add at least 2 chapters to reorder.</p>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="chapters-sort-list">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {items.map((chapter, index) => (
                      <Draggable key={chapter.id} draggableId={`chapter-sort-${chapter.id}`} index={index}>
                        {(dragProvided) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className="card border-0 bg-light mb-2"
                          >
                            <div className="card-body py-2 px-3 d-flex align-items-center gap-2">
                              <span className="text-muted">::</span>
                              <span className="small fw-semibold">{chapter.title}</span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </Modal.Body>
        <Modal.Footer className="justify-content-start">
          <button type="submit" className="btn btn-primary" disabled={loading || items.length < 2}>
            {loading ? 'Saving...' : 'Save Order'}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default ChapterSort;
