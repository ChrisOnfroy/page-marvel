const menuBtn = document.getElementById('menuBtn');
const menu = document.getElementById('menu');

console.log('Botón encontrado:', menuBtn);
console.log('Menú encontrado:', menu);

menuBtn.addEventListener('click', function() {
  console.log('¡Click detectado!');
  menu.classList.toggle('show');
  console.log('Clases del menú:', menu.className);
});