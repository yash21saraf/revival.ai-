/**
 * Extracts the YouTube Video ID from a given URL.
 */
export const getYoutubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * Fetches the high-res thumbnail for a YouTube video and converts it to a base64 string.
 * Uses a CORS proxy to allow client-side fetching.
 */
export const getYoutubeThumbnail = async (videoId: string): Promise<{ mimeType: string; data: string } | null> => {
  try {
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    // Use a public CORS proxy for demo purposes
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(thumbnailUrl)}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) return null;
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve({
          mimeType: 'image/jpeg',
          data: base64data.split(',')[1]
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Failed to fetch thumbnail:", error);
    return null;
  }
};

/**
 * Generates a placeholder frame if thumbnail fetching fails.
 */
export const generatePlaceholderFrame = (): { mimeType: string; data: string } => {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#18181b'; // zinc-900
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#4f46e5'; // indigo-600
    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Video Content', 640, 360);
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    return {
      mimeType: 'image/jpeg',
      data: dataUrl.split(',')[1]
    };
  }
  return { mimeType: 'image/jpeg', data: '' };
};
