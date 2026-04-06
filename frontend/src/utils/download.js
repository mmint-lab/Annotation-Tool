export async function downloadBlob(url, filename) {
  const token = localStorage.getItem("token");
  let res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if ((res.status === 404 || res.status === 401) && token) {
    res = await fetch(`${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`);
  }
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
  const blob = await res.blob();
  const a = document.createElement("a");
  const u = window.URL.createObjectURL(blob);
  a.href = u;
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(u);
}
