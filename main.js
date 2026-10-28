(function () {
  "use strict";

  // ---- Settings -----------------------------------------------------------
  // Paste your Formspree endpoints here (https://formspree.io/f/xxxxxxxx).
  // While a value is empty, the form opens an email to CONTACT_EMAIL instead.
  var CONFIG = {
    CONTACT_ENDPOINT: "",
    FOLLOW_ENDPOINT: "",
    CONTACT_EMAIL: "me@davidburrells.co.uk"
  };

  // ---- Header: solid background after scrolling, mobile menu ----------------
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 30); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var toggle = header.querySelector(".nav-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = header.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.textContent = open ? "Close" : "Menu";
      });
    }
  }

  // ---- Forms ---------------------------------------------------------------
  function setStatus(form, message, ok) {
    var el = form.querySelector(".form-status");
    if (!el) return;
    el.textContent = message;
    el.style.color = ok === false ? "#B3261E" : "";
  }

  document.querySelectorAll("form[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      // Honeypot: real visitors never fill this in.
      var trap = form.querySelector("[name=company_website]");
      if (trap && trap.value) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var kind = form.getAttribute("data-form");
      var endpoint = kind === "follow" ? CONFIG.FOLLOW_ENDPOINT : CONFIG.CONTACT_ENDPOINT;
      var data = new FormData(form);
      data.delete("company_website");

      if (!endpoint) {
        var lines = [];
        data.forEach(function (value, key) { if (key !== "consent") lines.push(key + ": " + value); });
        var subject = kind === "follow" ? "Please add me to your updates" : "Message from davidburrells.co.uk";
        window.location.href = "mailto:" + CONFIG.CONTACT_EMAIL +
          "?subject=" + encodeURIComponent(subject) +
          "&body=" + encodeURIComponent(lines.join("\n"));
        setStatus(form, "Opening your email app. If nothing happens, write to " + CONFIG.CONTACT_EMAIL + ".", true);
        return;
      }

      var button = form.querySelector("button[type=submit]");
      if (button) button.disabled = true;
      setStatus(form, "Sending…", true);

      fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (response) {
          if (!response.ok) throw new Error("Request failed");
          form.reset();
          setStatus(form, kind === "follow" ? "Thanks. You are on the list." : "Thanks. Your message has been sent.", true);
        })
        .catch(function () {
          setStatus(form, "That didn’t send. Please email " + CONFIG.CONTACT_EMAIL + " instead.", false);
        })
        .then(function () { if (button) button.disabled = false; });
    });
  });
})();
