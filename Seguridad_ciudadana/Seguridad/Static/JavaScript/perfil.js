// static/JavaScript/usuario/perfil.js

document.addEventListener('DOMContentLoaded', function () {
  // Animación de entrada para las tarjetas
  const cards = document.querySelectorAll('.card, .profile-content');
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
    card.classList.add('fade-in-up');
  });

  // Efecto hover para botones
  const buttons = document.querySelectorAll('.btn, .nav-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-2px)';
    });
    btn.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0)';
    });
  });

  // Menú móvil (si algún layout lo usa)
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.querySelector('.nav-menu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      navMenu.classList.toggle('nav-menu-active');
    });
  }
});
