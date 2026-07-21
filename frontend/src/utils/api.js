export async function uploadFile(file, question, onChunk, signal) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      const payload = {
        filename: file.name,
        type: file.name.endsWith(".pdf") ? "pdf" : "text",
        content: content,
        question: question,
      };

      try {
        // Note: The backend /upload route is currently non-streaming.
        // We'll wait for the full response, then pass it to onChunk.
        const response = await fetch("http://localhost:5000/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal,
        });

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        if (data.error) {
          onChunk(`\n[Error analyzing file: ${data.error}]`);
        } else {
          onChunk(data.reply);
        }
        resolve();
      } catch (err) {
        if (err.name !== "AbortError") reject(err);
        resolve();
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
