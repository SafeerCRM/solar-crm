export async function downloadOrOpenFile(fileUrl: string, title?: string) {
  try {
    if (!fileUrl) {
      alert('File URL is missing.');
      return;
    }

    const res = await fetch(fileUrl);

    if (!res.ok) {
      alert('Unable to open file. Please try again.');
      return;
    }

    const blob = await res.blob();

    const isNativeCapacitor =
      typeof window !== 'undefined' &&
      !!(window as any).Capacitor &&
      (window as any).Capacitor.isNativePlatform?.() === true;

    if (isNativeCapacitor) {
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      let binaryString = '';

      for (let i = 0; i < uint8Array.length; i += 1) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }

      const base64 = btoa(binaryString);

      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');

      const extension =
        fileUrl.split('?')[0].split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') ||
        'file';

      const safeName = `${String(title || 'document')
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .toLowerCase()}.${extension}`;

      const saved = await Filesystem.writeFile({
        path: safeName,
        data: base64,
        directory: Directory.Cache,
        recursive: true,
      });

      await Share.share({
        title: title || 'Document',
        text: title || 'Document',
        url: saved.uri,
        dialogTitle: 'Open / Share Document',
      });

      return;
    }

    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');

    setTimeout(() => window.URL.revokeObjectURL(url), 30000);
  } catch (error: any) {
    console.error('FILE DOWNLOAD ERROR', error);
    alert(error?.message || 'Unable to open file.');
  }
}