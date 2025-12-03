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


// ================== DROPDOWN USUARIO NAVBAR ==================

// Alternar menú
function toggleDropdown2() {
  const dropdownMenu = document.getElementById('dropdownUsuario');
  if (!dropdownMenu) return;
  dropdownMenu.classList.toggle('show');
}
window.toggleDropdown2 = toggleDropdown2;

// Cerrar si se hace click fuera
document.addEventListener('click', function (event) {
  const wrapper = document.querySelector('.dropdown2');
  const menu = document.getElementById('dropdownUsuario');

  if (!wrapper || !menu) return; // página sin dropdown

  const clickDentro = wrapper.contains(event.target);

  if (!clickDentro && menu.classList.contains('show')) {
    menu.classList.remove('show');
  }
});

// Cerrar con ESC
document.addEventListener('keydown', function (event) {
  if (event.key !== 'Escape') return;

  const menu = document.getElementById('dropdownUsuario');
  if (!menu) return;

  menu.classList.remove('show');
});