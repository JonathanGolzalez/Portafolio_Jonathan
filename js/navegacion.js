document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".nav-links a");
  const paginas = document.querySelectorAll(".pagina");

  function mostrarPagina(id) {
    paginas.forEach((pagina) => {
      pagina.classList.remove("active");
    });

    const pagina = document.getElementById(id);

    if (pagina) {
      pagina.classList.add("active");
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  // Mostrar Inicio al cargar
  mostrarPagina("inicio");

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      const destino = link.dataset.section;

      mostrarPagina(destino);
    });
  });
});
