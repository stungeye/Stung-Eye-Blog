// Legacy viewer for posts from 2003–2004.
//
// Those posts call display_image(), display_image_mult(), display_flash() and
// display_processing() from inline onclick handlers. On the old site these came from
// /gluttonscripts.js and opened popup windows. This file defines the same four
// functions, with the same arguments, so the posts work unchanged; it shows the
// content in an in-page dialog instead of a popup.
//
//   display_image(url, name, width, height)
//   display_image_mult(baseUrl, name, width, height, count)   // baseUrl + 1..count + ".jpg"
//   display_flash(url, name, width, height)                   // Flash: no longer plays
//   display_processing(path, sketch, name, width, height)     // Java applet: no longer runs
//
// Loaded only on pages whose content calls one of them (see layouts/base.njk).
(function () {
  "use strict";

  // The posts use absolute http://www.stungeye.com/ URLs. Make them root-relative so they
  // load from whichever host serves the page (https, workers.dev, local dev).
  function localUrl(url) {
    return String(url).replace(/^https?:\/\/(?:www\.)?stungeye\.com(?=\/)/i, "");
  }

  var dialog, titleEl, bodyEl, navEl, counterEl, prevBtn, nextBtn;
  var gallery = null; // { base, count, index, width, height, name }

  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      for (var key in props) {
        if (key === "className") node.className = props[key];
        else if (key === "text") node.textContent = props[key];
        else node.setAttribute(key, props[key]);
      }
    }
    (children || []).forEach(function (child) { node.appendChild(child); });
    return node;
  }

  function build() {
    if (dialog) return;
    titleEl = el("h2", { className: "legacy-viewer-title", id: "legacy-viewer-title" });
    var closeBtn = el("button", { type: "button", className: "legacy-viewer-close", "aria-label": "Close", text: "×" });
    closeBtn.addEventListener("click", close);

    prevBtn = el("button", { type: "button", text: "‹ Back" });
    nextBtn = el("button", { type: "button", text: "Next ›" });
    counterEl = el("span", { className: "legacy-viewer-counter", "aria-live": "polite" });
    prevBtn.addEventListener("click", function () { step(-1); });
    nextBtn.addEventListener("click", function () { step(1); });
    navEl = el("div", { className: "legacy-viewer-nav" }, [prevBtn, counterEl, nextBtn]);

    bodyEl = el("div", { className: "legacy-viewer-body" });
    dialog = el("dialog", { className: "legacy-viewer", "aria-labelledby": "legacy-viewer-title" }, [
      el("div", { className: "legacy-viewer-head" }, [titleEl, closeBtn]),
      bodyEl,
      navEl,
    ]);

    // A click on the backdrop (outside the dialog box) closes it.
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) close();
    });
    dialog.addEventListener("keydown", function (event) {
      if (!gallery) return;
      if (event.key === "ArrowLeft") { step(-1); event.preventDefault(); }
      if (event.key === "ArrowRight") { step(1); event.preventDefault(); }
    });
    dialog.addEventListener("close", function () {
      gallery = null;
      bodyEl.textContent = "";
    });
    document.body.appendChild(dialog);
  }

  function open(name) {
    build();
    titleEl.textContent = String(name || "").trim();
    bodyEl.textContent = "";
    navEl.hidden = true;
    if (!dialog.open) dialog.showModal();
  }

  function close() {
    if (dialog && dialog.open) dialog.close();
  }

  function image(src, alt, width, height) {
    var img = el("img", { src: src, alt: alt || "" });
    // Width and height give the browser the aspect ratio; CSS scales the image down to fit.
    if (width > 0 && height > 0) {
      img.width = width;
      img.height = height;
    }
    return img;
  }

  function note(text) {
    return el("p", { className: "legacy-viewer-note", text: text });
  }

  function showGalleryImage() {
    var g = gallery;
    bodyEl.textContent = "";
    bodyEl.appendChild(image(g.base + g.index + ".jpg", g.name + " (" + g.index + " of " + g.count + ")", g.width, g.height));
    counterEl.textContent = "Image " + g.index + " of " + g.count;
    prevBtn.disabled = g.index <= 1;
    nextBtn.disabled = g.index >= g.count;
  }

  function step(delta) {
    if (!gallery) return;
    var next = Math.min(gallery.count, Math.max(1, gallery.index + delta));
    if (next !== gallery.index) {
      gallery.index = next;
      showGalleryImage();
    }
  }

  window.display_image = function (url, name, width, height) {
    open(name);
    bodyEl.appendChild(image(localUrl(url), name, width, height));
    return false;
  };

  window.display_image_mult = function (base, name, width, height, count) {
    open(name);
    gallery = { base: localUrl(base), name: String(name || "").trim(), width: width, height: height, count: Math.max(1, count | 0), index: 1 };
    // Preload the rest, as the old viewer did.
    for (var i = 2; i <= gallery.count; i++) new Image().src = gallery.base + i + ".jpg";
    navEl.hidden = gallery.count < 2;
    showGalleryImage();
    return false;
  };

  window.display_flash = function (url, name) {
    open(name);
    bodyEl.appendChild(note("This was a Flash piece. Browsers no longer play Flash, so it can't be shown here."));
    return false;
  };

  window.display_processing = function (path, sketch, name) {
    open(name);
    bodyEl.appendChild(note("This was a Processing sketch that ran as a Java applet. Browsers no longer run applets, so it can't be shown here."));
    return false;
  };
})();
