document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".nav-links a");
  const paginas = document.querySelectorAll(".pagina");

  function mostrarPagina(id) {
    paginas.forEach((pagina) => {
      pagina.classList.remove("active");
    });

    links.forEach((link) => {
      link.classList.remove("active");
    });

    const pagina = document.getElementById(id);

    if (pagina) {
      pagina.classList.add("active");
    }

    const linkActivo = document.querySelector(`[data-section="${id}"]`);

    if (linkActivo) {
      linkActivo.classList.add("active");
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  mostrarPagina("inicio");

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      mostrarPagina(link.dataset.section);
    });
  });
});
