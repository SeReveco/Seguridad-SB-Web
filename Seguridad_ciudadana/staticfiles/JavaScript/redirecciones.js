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
