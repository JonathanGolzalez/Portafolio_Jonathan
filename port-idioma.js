const btn = document.getElementById("btnIdioma");
let idioma = localStorage.getItem("idioma") || "es";

function aplicarIdioma() {
    document.documentElement.lang = idioma;
    btn.textContent = idioma.toUpperCase();

    document.querySelectorAll("[data-es]").forEach(el => {
        el.innerHTML = el.getAttribute(`data-${idioma}`);
    });
}

aplicarIdioma();

btn.addEventListener("click", () => {
    idioma = idioma === "es" ? "en" : "es";
    localStorage.setItem("idioma", idioma);
    aplicarIdioma();
});