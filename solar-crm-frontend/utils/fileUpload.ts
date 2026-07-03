import axios from 'axios';

type UploadArgs = {
  file: File;
  endpoint: string;
  token?: string | null;
  fieldName?: string;
};

const isImage = (file: File) => file.type.startsWith('image/');

const compressImage = async (file: File) => {
  if (!isImage(file)) return file;

  const image = document.createElement('img');
  const objectUrl = URL.createObjectURL(file);

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = objectUrl;
  });

  const maxSide = 960;
  let { width, height } = image;

  if (width > height && width > maxSide) {
    height = Math.round((height * maxSide) / width);
    width = maxSide;
  } else if (height > maxSide) {
    width = Math.round((width * maxSide) / height);
    height = maxSide;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(objectUrl);
    return file;
  }

  ctx.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.7);
  });

  URL.revokeObjectURL(objectUrl);

  if (!blob) return file;

  if (blob.size >= file.size) return file;

  return new File(
    [blob],
    file.name.replace(/\.[^.]+$/, '.jpg'),
    {
      type: 'image/jpeg',
      lastModified: Date.now(),
    },
  );
};

export const uploadPreparedFile = async ({
  file,
  endpoint,
  token,
  fieldName = 'files',
}: UploadArgs): Promise<string> => {
  const preparedFile = await compressImage(file);

  const formData = new FormData();
  formData.append(fieldName, preparedFile);

  const res = await axios.post(endpoint, formData, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data?.fileUrl || res.data?.url || '';
};