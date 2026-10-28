(function () {
  "use strict";

  // ---- Settings -----------------------------------------------------------
  // Paste your Formspree endpoints here (https://formspree.io/f/xxxxxxxx).
  // While a value is empty, the form opens an email to CONTACT_EMAIL instead.
  var CONFIG = {
    CONTACT_ENDPOINT: "",
    FOLLOW_ENDPOINT: "",
    CONTACT_EMAIL: "me@davidburrells.co.uk",
    // Google Analytics 4 Measurement ID, e.g. "G-XXXXXXXXXX".
    // While empty, no banner is shown and nothing is loaded.
    GA_ID: "G-7SRJB1CR6G"
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


  // ---- Analytics (Google Analytics 4, loaded only after consent) -----------
  var CONSENT_KEY = "db_analytics_consent";

  function readConsent() {
    try { return window.localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function saveConsent(value) {
    try { window.localStorage.setItem(CONSENT_KEY, value); } catch (e) { /* ignore */ }
  }
  function loadAnalytics() {
    if (!CONFIG.GA_ID || window.__gaLoaded) return;
    window.__gaLoaded = true;
    var tag = document.createElement("script");
    tag.async = true;
    tag.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CONFIG.GA_ID);
    document.head.appendChild(tag);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", CONFIG.GA_ID);
  }
  function clearAnalyticsCookies() {
    var host = window.location.hostname.split(".").slice(-2).join(".");
    document.cookie.split(";").forEach(function (c) {
      var name = c.split("=")[0].trim();
      if (name === "_ga" || name.indexOf("_ga_") === 0 || name === "_gid") {
        document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=." + host;
        document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      }
    });
  }
  function showBanner() {
    var existing = document.getElementById("consent");
    if (existing) { existing.hidden = false; return; }
    var box = document.createElement("div");
    box.id = "consent";
    box.className = "consent";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-labelledby", "consent-title");
    box.innerHTML =
      '<p id="consent-title" class="consent-title">Analytics</p>' +
      '<p>I\u2019d like to use Google Analytics to see which pages are read. It sets cookies. It is not used for advertising. See the <a href="privacy.html">privacy notice</a>.</p>' +
      '<div class="consent-actions">' +
      '<button type="button" class="btn btn-light btn-sm" data-choice="granted">Accept</button>' +
      '<button type="button" class="btn btn-outline on-dark btn-sm" data-choice="denied">Decline</button>' +
      '</div>';
    box.addEventListener("click", function (event) {
      var choice = event.target && event.target.getAttribute && event.target.getAttribute("data-choice");
      if (!choice) return;
      saveConsent(choice);
      box.hidden = true;
      if (choice === "granted") loadAnalytics(); else clearAnalyticsCookies();
    });
    document.body.appendChild(box);
  }

  if (CONFIG.GA_ID) {
    var consent = readConsent();
    if (consent === "granted") loadAnalytics();
    else if (consent !== "denied") showBanner();

    var legal = document.querySelector(".legal");
    if (legal) {
      var link = document.createElement("button");
      link.type = "button";
      link.className = "linkish";
      link.textContent = "Cookie settings";
      link.addEventListener("click", showBanner);
      legal.appendChild(link);
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
