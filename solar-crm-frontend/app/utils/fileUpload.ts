import imageCompression from 'browser-image-compression';

export async function prepareFileForUpload(file: File): Promise<File> {
  const mimeType = file.type || '';

  const isImage = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';
  const isAudio = mimeType.startsWith('audio/');

  const maxAllowedSize = 20 * 1024 * 1024;

  if (!isImage && !isPdf && !isAudio) {
    throw new Error('Only image, PDF or audio files are allowed');
  }

  if (file.size > maxAllowedSize) {
    throw new Error('File must be less than 20 MB');
  }

  if (!isImage) {
    return file;
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: 1.2,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    initialQuality: 0.75,
  });

  return new File(
    [compressed],
    file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '.jpg'),
    {
      type: compressed.type || 'image/jpeg',
      lastModified: Date.now(),
    },
  );
}

export async function uploadPreparedFile({
  file,
  endpoint,
  token,
  fieldName = 'file',
}: {
  file: File;
  endpoint: string;
  token?: string | null;
  fieldName?: string;
}) {
  const preparedFile = await prepareFileForUpload(file);

  const formData = new FormData();
  formData.append(fieldName, preparedFile);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || 'Failed to upload file');
  }

  return data.fileUrl as string;
}