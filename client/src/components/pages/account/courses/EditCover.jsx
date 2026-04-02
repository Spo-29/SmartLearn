import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview, FilePondPluginFileValidateType);

const EditCover = ({ courseId, course, onUploaded }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

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

  useEffect(() => {
    if (course?.course_small_image) {
      setPreviewUrl(course.course_small_image);
      return;
    }

    if (course?.image) {
      setPreviewUrl(`${import.meta.env.VITE_BACKEND_ENDPOINT}/upload/course/small/${course.image}`);
      return;
    }

    setPreviewUrl(null);
  }, [course]);

  const uploadImage = async (imageFile) => {
    if (!token || !imageFile || uploading) {
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/api/courses/${courseId}/image`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.status === 200) {
        const uploadedCourse = result.data;
        setPreviewUrl(
          uploadedCourse?.course_small_image ||
            `${import.meta.env.VITE_BACKEND_ENDPOINT}/upload/course/small/${uploadedCourse?.image}`,
        );
        if (onUploaded) {
          onUploaded(uploadedCourse);
        }
        toast.success(result.message || 'Course image uploaded successfully.');
      } else if (result.errors?.image?.[0]) {
        toast.error(result.errors.image[0]);
      } else {
        toast.error(result.message || 'Failed to upload course image.');
      }
    } catch (error) {
      toast.error('Failed to upload course image.');
    } finally {
      setUploading(false);
      setFiles([]);
    }
  };

  return (
    <div className="card border-0 shadow-lg">
      <div className="card-body p-4">
        <h3 className="h5">Cover Image</h3>

        <div className="mt-2">
          <FilePond
            files={files}
            onupdatefiles={setFiles}
            onaddfile={(error, fileItem) => {
              if (!error && fileItem?.file) {
                uploadImage(fileItem.file);
              }
            }}
            allowMultiple={false}
            acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
            allowFileTypeValidation
            instantUpload={false}
            allowProcess={false}
            labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
          />
        </div>

        {uploading && <p className="small text-muted mb-0 mt-2">Uploading image...</p>}

        {previewUrl && (
          <div className="mt-3">
            <img src={previewUrl} alt="Course cover" className="img-fluid rounded" />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditCover;
