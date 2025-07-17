// Admin Login
document.getElementById('adminLoginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;
  const errorElement = document.getElementById('loginError');

  try {
    const response = await fetch('https://your-cyclic-app.cyclic.app/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (response.ok) {
      const { token } = await response.json();
      localStorage.setItem('adminToken', token);
      window.location.href = '/admin/dashboard.html';
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
  } catch (error) {
    errorElement.textContent = error.message;
    errorElement.style.display = 'block';
  }
});

// Auth Check for Admin Pages
if (window.location.pathname.includes('/admin/') && 
    !window.location.pathname.includes('login.html')) {
  const token = localStorage.getItem('adminToken');
  
  if (!token) {
    window.location.href = '/admin/login.html';
  } else {
    // Verify token on page load
    fetch('https://your-cyclic-app.cyclic.app/api/admin/verify', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(response => {
      if (!response.ok) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login.html';
      }
    });
  }
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  localStorage.removeItem('adminToken');
  window.location.href = '/admin/login.html';
});