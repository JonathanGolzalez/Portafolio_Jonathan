const btn = document.getElementById("btnIdioma");
const btnCV = document.getElementById("btnCV");
const textoIdioma = btn.querySelector(".idioma-text");
const indicador = btn.querySelector(".estado-indicador");

let idioma = localStorage.getItem("idioma") || "es";

function aplicarIdioma() {
  // Idioma del documento
  document.documentElement.lang = idioma;

  // Texto botón idioma
  textoIdioma.textContent = idioma.toUpperCase();

  // Indicador
  indicador.classList.remove("es", "en");
  indicador.classList.add(idioma);

  // Traducciones
  document.querySelectorAll("[data-es]").forEach((el) => {
    el.innerHTML = el.getAttribute(`data-${idioma}`);
  });

  // CV según idioma
  if (btnCV) {
    btnCV.href =
      idioma === "es"
        ? "curriculum-vitae/Jonathan-Backend-PO-ES.pdf"
        : "curriculum-vitae/Jonathan-Backend-PO-EN.pdf";
  }
}
// Aplicar idioma al cargar
aplicarIdioma();

// Cambiar idioma al hacer click
btn.addEventListener("click", () => {
  idioma = idioma === "es" ? "en" : "es";

  localStorage.setItem("idioma", idioma);

  aplicarIdioma();
});
