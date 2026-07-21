export async function streamChat(
  message,
  history,
  onChunk,
  signal,
  model,
  globalContext,
  useWebSearch,
) {
  const response = await fetch("http://localhost:5000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history,
      model,
      global_context: globalContext,
      use_web_search: useWebSearch,
    }),
    signal,
  });

  if (!response.ok) throw new Error("Network response was not ok");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    onChunk(chunk);
  }
}

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

export async function generateTitle(message) {
  try {
    const response = await fetch("http://localhost:5000/generate-title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await response.json();
    return data.title;
  } catch (err) {
    return message.slice(0, 30);
  }
}
