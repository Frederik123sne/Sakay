document.getElementById('feedback').addEventListener('submit', async (e) => {
    e.preventDefault(); // prevent full-page reload

    const form = e.target;
    const formData = new FormData(form);
    const responseDiv = document.getElementById('response');

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: formData,
      });

      const text = await res.text();
      responseDiv.innerHTML = text;

      form.reset();
    } catch (error) {
      responseDiv.style.color = 'red';
      responseDiv.textContent = 'Error connecting to server.';
    }
  });