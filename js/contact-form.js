/* =============================================================
   contact-form.js — Formulario de contacto seguro
   Validaciones + filtro de lenguaje inapropiado + anti-spam
   ============================================================= */

(function () {
  "use strict";

  /* ── Elementos del DOM ─────────────────────────────────────── */
  const form = document.getElementById("contactoForm");
  const msg = document.getElementById("formMensaje");
  const btn = document.getElementById("btnEnviar");

  if (!form || !msg || !btn) return;

  /* ── Palabras inapropiadas (ES + EN, extensible) ───────────── */
  const PALABRAS_OBSCENAS = [
    // Español
    "puta",
    "puto",
    "mierda",
    "coño",
    "joder",
    "hostia",
    "cabrón",
    "cabron",
    "gilipollas",
    "imbécil",
    "imbecil",
    "idiota",
    "pendejo",
    "maricón",
    "maricon",
    "hijoputa",
    "verga",
    "culo",
    "polla",
    "follar",
    "zorra",
    "perra",
    "culero",
    "chinga",
    "chingada",
    "wey",
    "guey",
    "mamada",
    "pinche",
    "culero",
    "cagada",
    // Inglés
    "fuck",
    "shit",
    "bitch",
    "asshole",
    "cunt",
    "dick",
    "cock",
    "pussy",
    "faggot",
    "nigger",
    "nigga",
    "bastard",
    "motherfucker",
    "whore",
    "slut",
    "retard",
    "dumbass",
    "jackass",
    "crap",
    "damn",
    "hell",
    "ass",
    "piss",
    "jerk",
  ];

  /* Convierte la lista en una RegExp eficiente */
  const RE_OBSCENAS = new RegExp(
    "\\b(" +
      PALABRAS_OBSCENAS.map((p) =>
        p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      ).join("|") +
      ")\\b",
    "i",
  );

  /* ── Límites de campos ──────────────────────────────────────── */
  const LIMITES = {
    nombre: { min: 2, max: 60 },
    email: { min: 5, max: 100 },
    mensaje: { min: 10, max: 1200 },
  };

  /* ── Anti-spam: tiempo mínimo para rellenar el formulario ───── */
  const TIEMPO_MINIMO_MS = 4000; // 4 segundos
  const tiempoInicio = Date.now();

  /* ── Rate-limit suave (cliente) ─────────────────────────────── */
  const COOLDOWN_MS = 60_000; // 1 minuto entre envíos
  let ultimoEnvio = 0;

  /* ── Campo honeypot (debe estar vacío si es humano) ─────────── */
  // Agrega este input OCULTO en tu HTML dentro del <form>:
  // <input type="text" name="_honey" id="_honey" style="display:none" tabindex="-1" autocomplete="off">
  const honeypot = document.getElementById("_honey");

  /* ============================================================
     UTILIDADES
     ============================================================ */

  /** Muestra un mensaje de feedback */
  function mostrarMensaje(texto, tipo) {
    msg.textContent = texto;
    msg.className = "form-mensaje " + tipo;
    msg.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /** Limpia el feedback */
  function limpiarMensaje() {
    msg.textContent = "";
    msg.className = "form-mensaje";
  }

  /** Marca un campo con error visual */
  function marcarError(campo, texto) {
    campo.style.borderColor = "#e74c3c";
    campo.style.boxShadow = "0 0 0 3px rgba(231,76,60,0.15)";

    let errorEl = campo.parentElement.querySelector(".campo-error");
    if (!errorEl) {
      errorEl = document.createElement("span");
      errorEl.className = "campo-error";
      errorEl.style.cssText =
        "color:#e74c3c;font-size:0.8rem;margin-top:4px;display:block;";
      campo.parentElement.appendChild(errorEl);
    }
    errorEl.textContent = texto;
  }

  /** Limpia el error visual de un campo */
  function limpiarError(campo) {
    campo.style.borderColor = "";
    campo.style.boxShadow = "";
    const errorEl = campo.parentElement.querySelector(".campo-error");
    if (errorEl) errorEl.remove();
  }

  /** Sanitiza texto: elimina HTML/scripts, trim */
  function sanitizar(valor) {
    return valor
      .trim()
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }

  /** Valida formato de email */
  function esEmailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  /** Detecta lenguaje inapropiado */
  function contieneObscenidades(texto) {
    return RE_OBSCENAS.test(texto);
  }

  /** Detecta spam básico: URLs excesivas o mayúsculas */
  function pareceSpam(texto) {
    const urls = (texto.match(/https?:\/\//gi) || []).length;
    const mayus = (texto.match(/[A-ZÁÉÍÓÚ]/g) || []).length;
    const total = texto.replace(/\s/g, "").length;
    return urls > 2 || (total > 20 && mayus / total > 0.6);
  }

  /* ============================================================
     VALIDACIÓN INDIVIDUAL POR CAMPO (en tiempo real)
     ============================================================ */

  function validarCampo(campo) {
    const id = campo.id;
    const valor = campo.value;
    const lim = LIMITES[id];

    limpiarError(campo);

    /* Nombre */
    if (id === "nombre") {
      if (valor.trim().length < lim.min)
        return marcarError(
          campo,
          `El nombre debe tener al menos ${lim.min} caracteres.`,
        );
      if (valor.trim().length > lim.max)
        return marcarError(
          campo,
          `El nombre no puede superar ${lim.max} caracteres.`,
        );
      if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(valor.trim()))
        return marcarError(campo, "El nombre solo puede contener letras.");
      if (contieneObscenidades(valor))
        return marcarError(campo, "Por favor usa un lenguaje apropiado.");
    }

    /* Email */
    if (id === "email") {
      if (!valor.trim()) return marcarError(campo, "El correo es obligatorio.");
      if (!esEmailValido(valor.trim()))
        return marcarError(campo, "Ingresa un correo electrónico válido.");
      if (valor.length > lim.max)
        return marcarError(
          campo,
          `El correo no puede superar ${lim.max} caracteres.`,
        );
    }

    /* Mensaje */
    if (id === "mensaje") {
      if (valor.trim().length < lim.min)
        return marcarError(
          campo,
          `El mensaje debe tener al menos ${lim.min} caracteres.`,
        );
      if (valor.trim().length > lim.max)
        return marcarError(
          campo,
          `El mensaje no puede superar ${lim.max} caracteres. Actualmente: ${valor.trim().length}.`,
        );
      if (contieneObscenidades(valor))
        return marcarError(
          campo,
          "Por favor evita el uso de lenguaje inapropiado.",
        );
      if (pareceSpam(valor))
        return marcarError(
          campo,
          "El mensaje parece contener spam. Revísalo e inténtalo de nuevo.",
        );
    }

    return true; // campo válido
  }

  /* Agrega validación en tiempo real a cada campo */
  ["nombre", "email", "mensaje"].forEach((id) => {
    const campo = document.getElementById(id);
    if (!campo) return;
    campo.addEventListener("blur", () => validarCampo(campo));
    campo.addEventListener("input", () => {
      // Solo limpiar el error mientras escribe, sin volver a marcar
      limpiarError(campo);
    });
  });

  /* Contador de caracteres en el textarea */
  const textarea = document.getElementById("mensaje");
  if (textarea) {
    const contador = document.createElement("span");
    contador.style.cssText =
      "display:block;text-align:right;font-size:0.78rem;color:#a0a0a0;margin-top:4px;";
    contador.textContent = `0 / ${LIMITES.mensaje.max}`;
    textarea.parentElement.appendChild(contador);

    textarea.addEventListener("input", () => {
      const len = textarea.value.trim().length;
      contador.textContent = `${len} / ${LIMITES.mensaje.max}`;
      contador.style.color = len > LIMITES.mensaje.max ? "#e74c3c" : "#a0a0a0";
    });
  }

  /* ============================================================
     VALIDACIÓN GLOBAL ANTES DE ENVIAR
     ============================================================ */

  function validarTodo() {
    const campos = ["nombre", "email", "mensaje"];
    const asunto = document.getElementById("asunto");
    let valido = true;

    /* Campos de texto */
    campos.forEach((id) => {
      const campo = document.getElementById(id);
      if (campo && validarCampo(campo) !== true) valido = false;
    });

    /* Asunto (select) */
    if (asunto && !asunto.value) {
      marcarError(asunto, "Selecciona un asunto.");
      valido = false;
    } else if (asunto) {
      limpiarError(asunto);
    }

    return valido;
  }

  /* ============================================================
     ENVÍO CON AJAX (FormSubmit)
     ============================================================ */

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    limpiarMensaje();

    /* ── Honeypot ──────────────────────────────────────────────── */
    if (honeypot && honeypot.value.trim() !== "") {
      // Bot detectado: silenciosamente fingimos éxito
      mostrarMensaje("¡Mensaje enviado! Te respondo pronto.", "exito");
      form.reset();
      return;
    }

    /* ── Anti-spam: tiempo mínimo ──────────────────────────────── */
    if (Date.now() - tiempoInicio < TIEMPO_MINIMO_MS) {
      mostrarMensaje(
        "Has enviado el formulario demasiado rápido. Espera un momento.",
        "error",
      );
      return;
    }

    /* ── Rate-limit ────────────────────────────────────────────── */
    if (ultimoEnvio && Date.now() - ultimoEnvio < COOLDOWN_MS) {
      const restante = Math.ceil(
        (COOLDOWN_MS - (Date.now() - ultimoEnvio)) / 1000,
      );
      mostrarMensaje(
        `Por favor espera ${restante} segundos antes de enviar otro mensaje.`,
        "error",
      );
      return;
    }

    /* ── Validación completa ───────────────────────────────────── */
    if (!validarTodo()) {
      mostrarMensaje("Revisa los campos marcados antes de continuar.", "error");
      return;
    }

    /* ── Preparar y sanitizar datos ────────────────────────────── */
    const rawData = new FormData(form);
    const dataLimpia = new FormData();

    for (const [key, value] of rawData.entries()) {
      dataLimpia.append(
        key,
        typeof value === "string" ? sanitizar(value) : value,
      );
    }

    /* ── Enviar ────────────────────────────────────────────────── */
    btn.disabled = true;
    btn.querySelector("span").textContent =
      document.documentElement.lang === "en" ? "Sending…" : "Enviando…";

    try {
      const res = await fetch("https://formsubmit.co/ajax/jg783832@gmail.com", {
        method: "POST",
        body: dataLimpia,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      if (json.success === "true" || json.success === true) {
        mostrarMensaje("¡Mensaje enviado! Te respondo pronto. ✓", "exito");
        form.reset();
        /* Resetear contadores y errores visuales */
        ["nombre", "email", "mensaje", "asunto"].forEach((id) => {
          const el = document.getElementById(id);
          if (el) limpiarError(el);
        });
        if (textarea) {
          const cnt = textarea.parentElement.querySelector("span");
          if (cnt) cnt.textContent = `0 / ${LIMITES.mensaje.max}`;
        }
        ultimoEnvio = Date.now();
      } else {
        throw new Error("Respuesta inesperada del servidor");
      }
    } catch (err) {
      console.error("[contacto]", err);
      mostrarMensaje(
        "Hubo un error al enviar. Inténtalo de nuevo o escríbeme a jg783832@gmail.com",
        "error",
      );
    } finally {
      btn.disabled = false;
      btn.querySelector("span").textContent =
        document.documentElement.lang === "en"
          ? "Send message"
          : "Enviar mensaje";
    }
  });
})();
