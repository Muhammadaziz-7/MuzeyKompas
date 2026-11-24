import { useEffect, useState } from 'react';
import { getUploadedFile } from '../../services/uploadedFileService.js';

function UploadedFileLink({
  fileId,
  fallbackUrl,
  fileName,
  className,
  children,
  ...linkProps
}) {
  const [fileState, setFileState] = useState({ id: '', url: '', error: '' });

  useEffect(() => {
    if (!fileId) {
      return undefined;
    }

    let isActive = true;

    getUploadedFile(fileId)
      .then((fileRecord) => {
        if (!fileRecord) {
          throw new Error('Yuklangan fayl topilmadi.');
        }
        if (isActive) {
          setFileState({ id: fileId, url: fileRecord.url, error: '' });
        }
      })
      .catch((loadError) => {
        if (isActive) {
          setFileState({
            id: fileId,
            url: '',
            error: loadError instanceof Error ? loadError.message : 'Faylni yuklab bo‘lmadi.',
          });
        }
      });

    return () => {
      isActive = false;
    };
  }, [fileId]);

  const href = fileId
    ? fileState.id === fileId
      ? fileState.url
      : ''
    : fallbackUrl;
  const error = fileState.id === fileId ? fileState.error : '';

  return (
    <>
      <a
        {...linkProps}
        className={className}
        href={href || undefined}
        download={fileName || undefined}
        aria-disabled={!href}
        aria-busy={Boolean(fileId && !href && !error)}
        tabIndex={href ? undefined : -1}
        onClick={(event) => {
          if (!href) {
            event.preventDefault();
          }
        }}
      >
        {children}
      </a>
      {error && <small className="uploaded-file-error" role="alert">{error}</small>}
    </>
  );
}

export default UploadedFileLink;
