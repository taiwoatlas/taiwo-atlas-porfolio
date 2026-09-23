(function () {
  "use strict";
  var grids = document.querySelectorAll(".svc-grid");
  if (!grids.length) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canObserve = "IntersectionObserver" in window && !reduce;

  grids.forEach(function (grid) {
    var scope = grid.closest(".svc-section") || document;
    var cards = [].slice.call(grid.querySelectorAll(".svc-card"));
    var tabs = [].slice.call(scope.querySelectorAll(".svc-tab"));

    cards.forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - r.left + "px");
        card.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });

    function show(list) {
      list.forEach(function (card, i) {
        card.style.transitionDelay = (i % 3) * 90 + "ms";
        card.classList.add("in");
        setTimeout(function () { card.style.transitionDelay = ""; }, 1000);
      });
    }

    if (canObserve) {
      grid.classList.add("svc-js");
      var io = new IntersectionObserver(function (entries) {
        var batch = [];
        entries.forEach(function (en) {
          if (en.isIntersecting) { batch.push(en.target); io.unobserve(en.target); }
        });
        if (batch.length) show(batch);
      }, { threshold: 0.12 });
      cards.forEach(function (c) { io.observe(c); });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var f = tab.getAttribute("data-filter");
        tabs.forEach(function (t) {
          var on = t === tab;
          t.classList.toggle("is-active", on);
          t.setAttribute("aria-pressed", on ? "true" : "false");
        });
        var visible = [];
        cards.forEach(function (c) {
          var match = f === "all" || c.getAttribute("data-group") === f;
          c.hidden = !match;
          if (match) visible.push(c);
        });
        if (canObserve) {
          visible.forEach(function (c) { c.classList.remove("in"); });
          void grid.offsetWidth;
          requestAnimationFrame(function () { show(visible); });
        }
      });
    });
  });
})();
