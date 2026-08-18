const MAX_IMAGE_BYTES = 200 * 1024;
const MAX_TOTAL_BYTES = 900 * 1024;
const DIMENSIONS = [1280, 1024, 800, 640];
const QUALITIES = [0.7, 0.55, 0.4, 0.28];

function dataUrlToBlob(dataUrl) {
  const [header, data] = String(dataUrl).split(",");
  const mime = /data:(.*?);/.exec(header)?.[1] || "image/jpeg";
  const binary = atob(data || "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

async function loadImageSource(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through */
    }
  }
  return loadImageElement(file);
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve) => {
    const fallback = () => {
      try {
        resolve(dataUrlToBlob(canvas.toDataURL("image/jpeg", quality)));
      } catch {
        resolve(null);
      }
    };

    if (typeof canvas.toBlob !== "function") {
      fallback();
      return;
    }

    canvas.toBlob(
      (blob) => {
        if (blob && blob.size > 0) {
          resolve(blob);
          return;
        }
        fallback();
      },
      "image/jpeg",
      quality,
    );
  });
}

function toJpegFile(blob, name) {
  const fileName = name.endsWith(".jpg") ? name : `${name}.jpg`;
  try {
    return new File([blob], fileName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return blob;
  }
}

function drawScaled(source, maxDimension) {
  const width = source.width;
  const height = source.height;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(source, 0, 0, w, h);
  return canvas;
}

export async function compressImageFile(file, maxBytes = MAX_IMAGE_BYTES) {
  if (!(file instanceof Blob)) return file;

  const type = String(file.type || "").toLowerCase();
  if (type && !type.startsWith("image/")) return file;
  if (type === "image/gif" || type === "image/svg+xml") return file;

  let source;
  try {
    source = await loadImageSource(file);
  } catch {
    if (file.size > maxBytes) {
      throw new Error(
        "This photo could not be compressed. Please choose a smaller JPEG or PNG.",
      );
    }
    return file;
  }

  if (!source?.width || !source?.height) {
    if (typeof source?.close === "function") source.close();
    return file;
  }

  let best = file.size <= maxBytes ? file : null;

  for (const dimension of DIMENSIONS) {
    const canvas = drawScaled(source, dimension);
    if (!canvas) continue;
    for (const quality of QUALITIES) {
      const blob = await canvasToBlob(canvas, quality);
      if (!blob || blob.size <= 0) continue;
      if (!best || blob.size < best.size) best = blob;
      if (blob.size <= maxBytes) {
        if (typeof source.close === "function") source.close();
        const baseName = String(file.name || "photo").replace(/\.[^.]+$/, "");
        return toJpegFile(blob, baseName);
      }
    }
  }

  if (typeof source.close === "function") source.close();

  if (!best || best.size > maxBytes) {
    throw new Error(
      "Photos are still too large after compression. Try one or two images.",
    );
  }

  const baseName = String(file.name || "photo").replace(/\.[^.]+$/, "");
  return toJpegFile(best, baseName);
}

export async function compressListingImages(images = []) {
  if (!Array.isArray(images)) return [];

  const files = images.filter((img) => img instanceof Blob);
  const kept = images.filter((img) => !(img instanceof Blob));
  const perImage = Math.max(
    80 * 1024,
    Math.floor(MAX_TOTAL_BYTES / Math.max(files.length, 1)),
  );

  const compressedFiles = [];
  for (const file of files) {
    compressedFiles.push(await compressImageFile(file, perImage));
  }

  const total = compressedFiles.reduce((sum, file) => sum + (file.size || 0), 0);
  if (total > MAX_TOTAL_BYTES) {
    throw new Error(
      "Photos are still too large after compression. Try fewer images.",
    );
  }

  return [...kept, ...compressedFiles];
}

export function appendImagesToFormData(formData, images = []) {
  if (!formData || !Array.isArray(images)) return;
  images.forEach((img, index) => {
    if (!(img instanceof Blob)) return;
    const name = img.name || `photo-${index + 1}.jpg`;
    formData.append("images", img, name);
  });
}

export function listingUploadErrorMessage(err, fallback = "Save failed") {
  const raw = String(err?.message || "");
  if (
    err?.name === "ApiNetworkError" ||
    raw.includes("Unable to reach API") ||
    raw.includes("Upload to") ||
    raw === "Network Error"
  ) {
    return "Upload failed. The server rejected the photo size. Try one smaller image.";
  }
  return err?.response?.data?.message || err?.message || fallback;
}
