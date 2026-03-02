(function () {
  var config = window.SITE_CONFIG || {};
  var products = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
  var categoryMap = Object.create(null);
  var gumroadCache = Object.create(null);

  (config.categories || []).forEach(function (category) {
    categoryMap[category.slug] = category;
  });

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildNav() {
    var nav = document.querySelector("[data-nav]");
    if (!nav) {
      return;
    }

    var path = window.location.pathname.split("/").pop() || "index.html";
    var links = [{ label: "Home", href: "index.html" }];

    (config.categories || []).forEach(function (category) {
      links.push({ label: category.name, href: category.page || "#" });
    });

    nav.innerHTML = links
      .map(function (link) {
        var active = path === link.href ? " is-active" : "";
        return (
          '<a class="nav-link' +
          active +
          '" href="' +
          escapeHtml(link.href) +
          '">' +
          escapeHtml(link.label) +
          "</a>"
        );
      })
      .join("");
  }

  function setCommonText() {
    var brandName = config.brandName || "Asset Store";
    document.querySelectorAll("[data-site-brand]").forEach(function (node) {
      node.textContent = brandName;
    });

    var footer = document.querySelector("[data-footer-text]");
    if (footer) {
      footer.textContent = config.footerText || "Built for creators.";
    }
  }

  function getCategoryName(slug) {
    var category = categoryMap[slug];
    return category ? category.name : "Assets";
  }

  function titleFromUrl(url) {
    try {
      var parsed = new URL(url);
      var slug = parsed.pathname.split("/").filter(Boolean).pop() || "digital-asset";
      return slug
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, function (m) {
          return m.toUpperCase();
        });
    } catch (_error) {
      return "Digital Asset";
    }
  }

  function initials(text) {
    var letters = String(text)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (word) {
        return word.charAt(0).toUpperCase();
      })
      .join("");
    return letters || "DA";
  }

  function createPills(product) {
    var pills = [];
    if (product.price) {
      pills.push('<span class="pill price">' + escapeHtml(product.price) + "</span>");
    }
    if (Array.isArray(product.tags)) {
      product.tags.slice(0, 3).forEach(function (tag) {
        pills.push('<span class="pill">' + escapeHtml(tag) + "</span>");
      });
    }
    return pills.join("");
  }

  function createThumb(product, titleText) {
    if (product.image) {
      return (
        '<div class="product-thumb"><img src="' +
        escapeHtml(product.image) +
        '" alt="' +
        escapeHtml(titleText) +
        '"></div>'
      );
    }

    return '<div class="product-thumb">' + escapeHtml(initials(titleText)) + "</div>";
  }

  function createProductCard(product, index) {
    var categoryName = getCategoryName(product.category);
    var titleText = product.title || titleFromUrl(product.gumroadUrl || "");
    var descriptionText =
      product.description || "Digital asset sold through secure Gumroad checkout.";
    var card = document.createElement("article");

    card.className = "product-card";
    card.style.setProperty("--delay", String(index * 80) + "ms");
    card.innerHTML =
      createThumb(product, titleText) +
      '<div class="product-body">' +
      '<p class="product-kicker">' +
      escapeHtml(categoryName) +
      "</p>" +
      '<h3 class="product-title" data-product-title>' +
      escapeHtml(titleText) +
      "</h3>" +
      '<p class="product-description" data-product-description>' +
      escapeHtml(descriptionText) +
      "</p>" +
      '<div class="product-meta">' +
      createPills(product) +
      "</div>" +
      '<div class="product-actions">' +
      '<a class="button button-primary gumroad-button" href="' +
      escapeHtml(product.gumroadUrl || "#") +
      '">Buy on Gumroad</a>' +
      '<a class="button button-secondary" href="' +
      escapeHtml(product.gumroadUrl || "#") +
      '" target="_blank" rel="noopener">View Details</a>' +
      "</div>" +
      "</div>";

    hydrateFromGumroad(product, card);
    return card;
  }

  function oembedUrl(url) {
    return "https://gumroad.com/oembed?url=" + encodeURIComponent(url);
  }

  function hydrateFromGumroad(product, card) {
    if (!product.gumroadUrl) {
      return;
    }

    // Skip auto-hydration if all content is already defined.
    if (product.title && product.description && product.image) {
      return;
    }

    if (gumroadCache[product.gumroadUrl]) {
      applyGumroadData(card, product, gumroadCache[product.gumroadUrl]);
      return;
    }

    fetch(oembedUrl(product.gumroadUrl))
      .then(function (response) {
        if (!response.ok) {
          throw new Error("oEmbed request failed");
        }
        return response.json();
      })
      .then(function (data) {
        gumroadCache[product.gumroadUrl] = data;
        applyGumroadData(card, product, data);
      })
      .catch(function () {
        // Silent fallback keeps the static page stable if Gumroad blocks the request.
      });
  }

  function applyGumroadData(card, product, data) {
    if (!card || !data) {
      return;
    }

    var titleEl = card.querySelector("[data-product-title]");
    if (titleEl && !product.title && data.title) {
      titleEl.textContent = data.title;
    }

    var descEl = card.querySelector("[data-product-description]");
    if (descEl && !product.description && data.author_name) {
      descEl.textContent = "From " + data.author_name + " on Gumroad.";
    }

    if (!product.image && data.thumbnail_url) {
      var thumb = card.querySelector(".product-thumb");
      var updatedTitle = titleEl ? titleEl.textContent : "Product Image";
      if (thumb) {
        thumb.innerHTML =
          '<img src="' +
          escapeHtml(data.thumbnail_url) +
          '" alt="' +
          escapeHtml(updatedTitle) +
          '">';
      }
    }
  }

  function renderCategoryCards() {
    var grid = document.querySelector("[data-category-grid]");
    if (!grid) {
      return;
    }

    grid.innerHTML = (config.categories || [])
      .map(function (category) {
        var count = products.filter(function (product) {
          return product.category === category.slug;
        }).length;

        return (
          '<a class="category-card" href="' +
          escapeHtml(category.page || "#") +
          '">' +
          '<span class="category-count">' +
          String(count) +
          " products</span>" +
          "<h3>" +
          escapeHtml(category.name) +
          "</h3>" +
          "<p>" +
          escapeHtml(category.description || "") +
          "</p>" +
          "</a>"
        );
      })
      .join("");
  }

  function renderProductGrid(selector, list) {
    var grid = document.querySelector(selector);
    if (!grid) {
      return;
    }

    if (!Array.isArray(list) || list.length === 0) {
      grid.innerHTML =
        '<div class="empty-state">No products yet. Add your Gumroad links in assets/js/products.js.</div>';
      return;
    }

    grid.innerHTML = "";
    list.forEach(function (product, index) {
      grid.appendChild(createProductCard(product, index));
    });
  }

  function renderHomePage() {
    var title = document.querySelector("[data-hero-title]");
    if (title) {
      title.textContent = config.heroTitle || title.textContent;
    }

    var subtitle = document.querySelector("[data-hero-subtitle]");
    if (subtitle) {
      subtitle.textContent = config.heroSubtitle || subtitle.textContent;
    }

    var cta = document.querySelector("[data-hero-cta]");
    if (cta && config.heroCta) {
      cta.textContent = config.heroCta.label || cta.textContent;
      cta.setAttribute("href", config.heroCta.href || cta.getAttribute("href"));
    }

    renderCategoryCards();

    var featured = products.filter(function (item) {
      return Boolean(item.featured);
    });

    renderProductGrid("[data-featured-grid]", featured.length ? featured : products.slice(0, 6));
  }

  function renderCategoryPage() {
    var slug = document.body.getAttribute("data-category");
    var category = categoryMap[slug];
    var nameNode = document.querySelector("[data-category-name]");
    var descNode = document.querySelector("[data-category-description]");

    if (category && nameNode) {
      nameNode.textContent = category.name;
      document.title = category.name + " | " + (config.brandName || "Asset Store");
    }

    if (category && descNode) {
      descNode.textContent = category.description || descNode.textContent;
    }

    var categoryProducts = products.filter(function (product) {
      return product.category === slug;
    });

    renderProductGrid("[data-category-grid-products]", categoryProducts);
  }

  setCommonText();
  buildNav();

  if (document.body.getAttribute("data-page") === "home") {
    renderHomePage();
  } else if (document.body.getAttribute("data-page") === "category") {
    renderCategoryPage();
  }
})();
