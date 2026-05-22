(function () {
  'use strict';

  var form = document.getElementById('login-form');
  var error = document.getElementById('login-error');
  var btn = document.getElementById('login-btn');
  var nextInput = document.getElementById('next');

  if (!form) return;

  var params = new URLSearchParams(window.location.search);
  if (params.get('next') && nextInput) {
    nextInput.value = params.get('next');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    error.classList.remove('show');
    btn.disabled = true;
    btn.textContent = 'Entrando...';

    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.username.value.trim(),
        password: form.password.value,
        next: nextInput ? nextInput.value : '/hub',
      }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok || !result.data.ok) {
          throw new Error((result.data && result.data.error) || 'No se pudo iniciar sesion.');
        }
        window.location.href = result.data.redirect || '/hub';
      })
      .catch(function (err) {
        error.textContent = err.message || 'Error de autenticacion.';
        error.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Entrar al playground';
      });
  });
})();
