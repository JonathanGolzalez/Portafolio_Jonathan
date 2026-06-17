const btn = document.getElementById("btnIdioma");
const textoIdioma = btn.querySelector(".idioma-text");
const indicador = btn.querySelector(".estado-indicador");

let idioma = localStorage.getItem("idioma") || "es";

function aplicarIdioma() {
  // Cambiar idioma del documento
  document.documentElement.lang = idioma;

  // Cambiar texto del botón
  textoIdioma.textContent = idioma.toUpperCase();

  // Cambiar color del indicador
  indicador.classList.remove("es", "en");
  indicador.classList.add(idioma);

  // Traducir elementos
  document.querySelectorAll("[data-es]").forEach((el) => {
    el.innerHTML = el.getAttribute(`data-${idioma}`);
  });
}

// Aplicar idioma al cargar
aplicarIdioma();

// Cambiar idioma al hacer click
btn.addEventListener("click", () => {
  idioma = idioma === "es" ? "en" : "es";

  localStorage.setItem("idioma", idioma);

  aplicarIdioma();
});
