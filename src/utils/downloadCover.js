/**
 * Utility to download a book cover page image directly from database / storage.
 * Dedicated for Admin usage.
 */
export async function downloadCoverImage(coverUrl, bookTitle) {
  if (!coverUrl || coverUrl === "null" || coverUrl === "undefined") {
    alert("No cover image available in database for this title.");
    return;
  }

  const safeTitle = (bookTitle || "book_cover")
    .trim()
    .replace(/[^a-zA-Z0-9_\-\s]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60);

  try {
    const res = await fetch(coverUrl, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    let ext = "jpg";
    if (blob.type.includes("png")) ext = "png";
    else if (blob.type.includes("webp")) ext = "webp";
    else if (blob.type.includes("jpeg")) ext = "jpeg";
    else if (coverUrl.includes(".png")) ext = "png";
    else if (coverUrl.includes(".webp")) ext = "webp";

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${safeTitle}_Cover.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  } catch (err) {
    console.warn("Direct blob download failed, falling back to direct anchor:", err);
    const link = document.createElement("a");
    link.href = coverUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = `${safeTitle}_Cover.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
