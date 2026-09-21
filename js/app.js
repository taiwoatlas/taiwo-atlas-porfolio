(function(){
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- header scroll state ---------- */
  var header = document.querySelector(".site-header");
  if(header){
    var onScroll = function(){
      header.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, {passive:true});
  }

  /* ---------- mobile menu ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mobileMenu = document.querySelector(".mobile-menu");
  var lastFocused = null;
  function trapFocus(e){
    if(!mobileMenu.classList.contains("is-open")) return;
    if(e.key === "Escape"){ closeMenu(); return; }
    if(e.key !== "Tab") return;
    var focusables = mobileMenu.querySelectorAll('a,button');
    if(!focusables.length) return;
    var first = focusables[0], last = focusables[focusables.length-1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }
  function openMenu(){
    if(!mobileMenu) return;
    lastFocused = document.activeElement;
    mobileMenu.classList.add("is-open");
    navToggle.setAttribute("aria-expanded","true");
    document.body.style.overflow = "hidden";
    var firstLink = mobileMenu.querySelector("a");
    if(firstLink) firstLink.focus();
    document.addEventListener("keydown", trapFocus);
  }
  function closeMenu(){
    if(!mobileMenu) return;
    mobileMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded","false");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", trapFocus);
    if(lastFocused) lastFocused.focus();
  }
  if(navToggle && mobileMenu){
    navToggle.addEventListener("click", function(){
      mobileMenu.classList.contains("is-open") ? closeMenu() : openMenu();
    });
    var closeBtn = mobileMenu.querySelector(".mobile-menu-close");
    if(closeBtn) closeBtn.addEventListener("click", closeMenu);
    mobileMenu.querySelectorAll("a").forEach(function(a){ a.addEventListener("click", closeMenu); });
  }

  /* ---------- reveal on scroll ---------- */
  if(!reduced && "IntersectionObserver" in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, {threshold:0.12});
    document.querySelectorAll(".reveal").forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function(el){ el.classList.add("is-visible"); });
  }

  /* ---------- custom cursor (desktop, motion allowed) ---------- */
  if(!reduced && window.matchMedia("(hover:hover)").matches){
    var cursor = document.createElement("div");
    cursor.className = "custom-cursor";
    document.body.appendChild(cursor);
    document.addEventListener("mousemove", function(e){
      cursor.classList.add("is-active");
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
    });
    document.addEventListener("mouseleave", function(){ cursor.classList.remove("is-active"); });
    document.querySelectorAll("a,button,.work-tile,.archive-row").forEach(function(el){
      el.addEventListener("mouseenter", function(){ cursor.classList.add("is-hover"); });
      el.addEventListener("mouseleave", function(){ cursor.classList.remove("is-hover"); });
    });
  }

  /* ---------- case study TOC active state ---------- */
  var tocLinks = document.querySelectorAll(".case-toc a");
  var caseSections = document.querySelectorAll(".case-section");
  if(tocLinks.length && caseSections.length && "IntersectionObserver" in window){
    var tocObs = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        var link = document.querySelector('.case-toc a[href="#'+en.target.id+'"]');
        if(!link) return;
        if(en.isIntersecting){
          tocLinks.forEach(function(l){ l.classList.remove("is-active"); });
          link.classList.add("is-active");
        }
      });
    }, {rootMargin:"-40% 0px -50% 0px"});
    caseSections.forEach(function(s){ tocObs.observe(s); });
  }

  /* ---------- zone diagram interaction (TerraDrop-style) ---------- */
  document.querySelectorAll("[data-zone-diagram]").forEach(function(diagram){
    var cells = diagram.querySelectorAll(".zone-cell");
    var detail = diagram.querySelector(".zone-detail");
    cells.forEach(function(cell){
      cell.addEventListener("click", function(){
        cells.forEach(function(c){ c.classList.remove("is-active"); });
        cell.classList.add("is-active");
        if(!detail) return;
        var data = JSON.parse(cell.getAttribute("data-zone"));
        detail.innerHTML = Object.keys(data).map(function(k){
          return '<div><span>'+k+'</span>'+data[k]+'</div>';
        }).join("");
      });
    });
  });

  /* ---------- contact / intake form ---------- */
  document.querySelectorAll("form[data-validate]").forEach(function(form){
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var valid = true;
      form.querySelectorAll("[required]").forEach(function(field){
        var wrap = field.closest(".form-field");
        var ok = field.value && field.value.trim().length > (field.type === "email" ? 4 : 0);
        if(field.type === "email" && ok){ ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value); }
        if(wrap){ wrap.classList.toggle("has-error", !ok); }
        if(!ok) valid = false;
      });
      var status = form.querySelector(".form-status");
      if(!status) return;
      status.classList.remove("success","error");
      if(!valid){
        status.textContent = "A few fields need attention before this can be sent — check the highlighted fields above.";
        status.classList.add("error","is-visible");
        return;
      }
      var submitBtn = form.querySelector("button[type=submit]");
      if(submitBtn) submitBtn.disabled = true;
      status.textContent = "Sending…";
      status.classList.add("is-visible");
      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { "Accept": "application/json" }
      }).then(function(res){
        if(res.ok){
          status.textContent = "Thanks — your project brief is on its way. Taiwo will get back to you within one business day.";
          status.classList.remove("error");
          status.classList.add("success");
          form.reset();
        } else {
          return res.json().then(function(data){
            var msg = (data && data.errors) ? data.errors.map(function(e){ return e.message; }).join(", ") : "";
            throw new Error(msg);
          });
        }
      }).catch(function(){
        status.textContent = "Something went wrong sending this — please email taiwoatlas.dev@gmail.com directly instead.";
        status.classList.remove("success");
        status.classList.add("error");
      }).finally(function(){
        if(submitBtn) submitBtn.disabled = false;
      });
    });
  });

  /* ---------- archive: filter / sort / search / view toggle ---------- */
  var archive = document.querySelector("[data-archive]");
  if(archive){
    var items = Array.prototype.slice.call(archive.querySelectorAll("[data-project]"));
    var searchInput = document.querySelector("[data-archive-search]");
    var sortSelect = document.querySelector("[data-archive-sort]");
    var chips = document.querySelectorAll("[data-filter-chip]");
    var countEl = document.querySelector("[data-archive-count]");
    var emptyEl = document.querySelector("[data-archive-empty]");
    var clearAllBtn = document.querySelector("[data-clear-all]");
    var viewButtons = document.querySelectorAll("[data-view]");
    var grid = document.querySelector("[data-archive-grid]");
    var list = document.querySelector("[data-archive-list]");

    var state = {q:"", sector:"all", type:"all", sort:"featured"};

    function apply(){
      var activeContainer = (list && list.style.display !== "none") ? list : grid;
      var visible = 0;
      items.forEach(function(el){
        var text = (el.getAttribute("data-search") || "").toLowerCase();
        var sector = el.getAttribute("data-sector");
        var type = el.getAttribute("data-type");
        var match = (!state.q || text.indexOf(state.q) > -1) &&
                    (state.sector === "all" || sector === state.sector) &&
                    (state.type === "all" || type === state.type);
        el.style.display = match ? "" : "none";
        if(match && el.parentElement === activeContainer) visible++;
      });
      if(countEl) countEl.textContent = visible + (visible === 1 ? " project" : " projects");
      if(emptyEl) emptyEl.style.display = visible === 0 ? "block" : "none";

      // sort visible items within their container
      [grid,list].forEach(function(container){
        if(!container) return;
        var visItems = items.filter(function(el){ return el.parentElement === container && el.style.display !== "none"; });
        visItems.sort(function(a,b){
          if(state.sort === "newest") return (b.getAttribute("data-year")||0) - (a.getAttribute("data-year")||0);
          if(state.sort === "oldest") return (a.getAttribute("data-year")||0) - (b.getAttribute("data-year")||0);
          if(state.sort === "az") return a.getAttribute("data-title").localeCompare(b.getAttribute("data-title"));
          // featured
          return (b.getAttribute("data-featured")||0) - (a.getAttribute("data-featured")||0);
        });
        visItems.forEach(function(el){ container.appendChild(el); });
      });
    }

    if(searchInput) searchInput.addEventListener("input", function(){ state.q = this.value.toLowerCase(); apply(); });
    if(sortSelect) sortSelect.addEventListener("change", function(){ state.sort = this.value; apply(); });
    chips.forEach(function(chip){
      chip.addEventListener("click", function(){
        var group = chip.getAttribute("data-filter-chip");
        var val = chip.getAttribute("data-value");
        document.querySelectorAll('[data-filter-chip="'+group+'"]').forEach(function(c){ c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        state[group] = val;
        apply();
      });
    });
    if(clearAllBtn) clearAllBtn.addEventListener("click", function(){
      state = {q:"", sector:"all", type:"all", sort:"featured"};
      if(searchInput) searchInput.value = "";
      if(sortSelect) sortSelect.value = "featured";
      document.querySelectorAll("[data-filter-chip]").forEach(function(c){
        c.classList.toggle("is-active", c.getAttribute("data-value") === "all");
      });
      apply();
    });
    viewButtons.forEach(function(btn){
      btn.addEventListener("click", function(){
        viewButtons.forEach(function(b){ b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        var view = btn.getAttribute("data-view");
        if(grid) grid.style.display = view === "grid" ? "" : "none";
        if(list) list.style.display = view === "list" ? "" : "none";
        try{ localStorage.setItem("atlas-archive-view", view); }catch(e){}
        apply();
      });
    });
    try{
      var savedView = localStorage.getItem("atlas-archive-view");
      if(savedView){ var b = document.querySelector('[data-view="'+savedView+'"]'); if(b) b.click(); }
    }catch(e){}
    apply();
  }

  /* ---------- command palette + global search index ---------- */
  var cmdkTrigger = document.querySelector("[data-cmdk-trigger]");
  var cmdkOverlay = document.querySelector("[data-cmdk-overlay]");
  if(cmdkOverlay){
    var cmdkInput = cmdkOverlay.querySelector(".cmdk-input");
    var cmdkResults = cmdkOverlay.querySelector(".cmdk-results");
    var selectedIndex = 0;
    var index = window.__ATLAS_INDEX__ || [];

    function renderResults(q){
      var filtered = !q ? index.slice(0,8) : index.filter(function(i){
        return (i.title+" "+i.meta+" "+i.type).toLowerCase().indexOf(q.toLowerCase()) > -1;
      }).slice(0,20);
      selectedIndex = 0;
      if(!filtered.length){
        cmdkResults.innerHTML = '<div class="cmdk-empty">No matches. Try a project, sector, or page name.</div>';
        return;
      }
      cmdkResults.innerHTML = filtered.map(function(item,i){
        return '<a class="cmdk-item'+(i===0?" is-selected":"")+'" href="'+item.url+'" data-idx="'+i+'">'+
          '<span class="cmdk-item-title">'+item.title+'</span>'+
          '<span class="cmdk-item-meta">'+item.type+(item.meta? " · "+item.meta:"")+'</span></a>';
      }).join("");
    }
    function openPalette(){
      cmdkOverlay.classList.add("is-open");
      cmdkInput.value = "";
      renderResults("");
      setTimeout(function(){ cmdkInput.focus(); }, 10);
    }
    function closePalette(){ cmdkOverlay.classList.remove("is-open"); }
    if(cmdkTrigger) cmdkTrigger.addEventListener("click", openPalette);
    cmdkOverlay.addEventListener("click", function(e){ if(e.target === cmdkOverlay) closePalette(); });
    document.addEventListener("keydown", function(e){
      if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"){ e.preventDefault(); openPalette(); }
      if(e.key === "Escape") closePalette();
      if(cmdkOverlay.classList.contains("is-open")){
        var itemsEls = cmdkResults.querySelectorAll(".cmdk-item");
        if(e.key === "ArrowDown"){ e.preventDefault(); selectedIndex = Math.min(selectedIndex+1, itemsEls.length-1); }
        if(e.key === "ArrowUp"){ e.preventDefault(); selectedIndex = Math.max(selectedIndex-1, 0); }
        if(e.key === "ArrowDown" || e.key === "ArrowUp"){
          itemsEls.forEach(function(el,i){ el.classList.toggle("is-selected", i===selectedIndex); });
          if(itemsEls[selectedIndex]) itemsEls[selectedIndex].scrollIntoView({block:"nearest"});
        }
        if(e.key === "Enter"){ var sel = itemsEls[selectedIndex]; if(sel) window.location.href = sel.getAttribute("href"); }
      }
    });
    cmdkInput.addEventListener("input", function(){ renderResults(this.value); });
  }

  /* ---------- global /search page ---------- */
  var searchPage = document.querySelector("[data-search-page]");
  if(searchPage){
    var spInput = searchPage.querySelector("[data-search-input]");
    var spResults = searchPage.querySelector("[data-search-results]");
    var spEmpty = searchPage.querySelector("[data-search-empty]");
    var spIndex = window.__ATLAS_INDEX__ || [];
    function runSearch(q){
      if(!q){ spResults.innerHTML = ""; spEmpty.style.display = "block"; spEmpty.textContent = "Start typing to search projects, journal articles and pages."; return; }
      var res = spIndex.filter(function(i){ return (i.title+" "+i.meta+" "+i.type).toLowerCase().indexOf(q.toLowerCase()) > -1; });
      if(!res.length){ spResults.innerHTML = ""; spEmpty.style.display = "block"; spEmpty.textContent = 'No results for "'+q+'". Try a different term.'; return; }
      spEmpty.style.display = "none";
      spResults.innerHTML = res.map(function(r){
        return '<a class="archive-row" href="'+r.url+'"><span class="archive-row-index label-muted">'+r.type+'</span>'+
          '<span class="archive-row-title">'+r.title+'</span><span class="archive-row-tag">'+ (r.meta||"") +'</span></a>';
      }).join("");
    }
    if(spInput){
      spInput.addEventListener("input", function(){ runSearch(this.value); });
      var params = new URLSearchParams(window.location.search);
      if(params.get("q")){ spInput.value = params.get("q"); runSearch(spInput.value); }
      else runSearch("");
    }
  }

})();
