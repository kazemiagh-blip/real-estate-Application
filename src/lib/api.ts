export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      data?.error || `Request failed with status ${res.status}`,
      res.status
    );
  }
  return data as T;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export async function uploadPropertyImages(fileList: FileList | File[]): Promise<string[]> {
  const filesArr = Array.from(fileList);
  if (filesArr.length === 0) return [];
  const payload = await Promise.all(
    filesArr.map(async (f) => ({
      name: f.name,
      dataUrl: await fileToDataUrl(f),
    }))
  );
  const res = await apiFetch<{ urls: string[] }>('/api/upload', {
    method: 'POST',
    body: JSON.stringify({ files: payload }),
  });
  return res.urls;
}
