/**
 * Theme Wishlist Controller
 * Manages client-side wishlist state in localStorage, synchronizes header count badges,
 * and updates heart buttons across all product cards and pages.
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'theme_wishlist';

  const ThemeWishlist = {
    getItems: function() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('[Wishlist] Error reading from localStorage', e);
        return [];
      }
    },

    saveItems: function(items) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        this.dispatchUpdate(items);
      } catch (e) {
        console.warn('[Wishlist] Error saving to localStorage', e);
      }
    },

    getCount: function() {
      return this.getItems().length;
    },

    hasItem: function(idOrHandle) {
      if (!idOrHandle) return false;
      const str = String(idOrHandle).toLowerCase();
      return this.getItems().some(function(item) {
        return (item.id && String(item.id).toLowerCase() === str) ||
               (item.handle && String(item.handle).toLowerCase() === str);
      });
    },

    addItem: function(item) {
      if (!item || (!item.id && !item.handle)) return;
      const items = this.getItems();
      const idOrHandle = item.id || item.handle;
      if (!this.hasItem(idOrHandle)) {
        items.unshift(item);
        this.saveItems(items);
      }
    },

    removeItem: function(idOrHandle) {
      if (!idOrHandle) return;
      const str = String(idOrHandle).toLowerCase();
      const items = this.getItems().filter(function(item) {
        return (item.id && String(item.id).toLowerCase() !== str) &&
               (item.handle && String(item.handle).toLowerCase() !== str);
      });
      this.saveItems(items);
    },

    toggleItem: function(btn, itemData) {
      if (!itemData) {
        itemData = this.extractItemDataFromElement(btn);
      }
      if (!itemData || (!itemData.id && !itemData.handle)) return;

      const key = itemData.id || itemData.handle;
      const isAlreadySaved = this.hasItem(key);

      if (isAlreadySaved) {
        this.removeItem(key);
        if (btn) {
          btn.classList.remove('active', 'is-active');
          btn.setAttribute('aria-label', 'Add to wishlist');
        }
      } else {
        this.addItem(itemData);
        if (btn) {
          btn.classList.add('active', 'is-active');
          btn.setAttribute('aria-label', 'Remove from wishlist');
        }
      }

      this.updateButtons();
    },

    extractItemDataFromElement: function(el) {
      if (!el) return null;
      return {
        id: el.dataset.productId || '',
        handle: el.dataset.productHandle || '',
        title: el.dataset.productTitle || '',
        price: el.dataset.productPrice || '',
        compare_at_price: el.dataset.productComparePrice || '',
        image: el.dataset.productImage || '',
        url: el.dataset.productUrl || '',
        variant_id: el.dataset.productVariantId || ''
      };
    },

    updateButtons: function() {
      const self = this;
      const buttons = document.querySelectorAll('[data-wishlist-btn], .card__wishlist-btn, .deal-grid-card__wishlist');
      buttons.forEach(function(btn) {
        const id = btn.dataset.productId;
        const handle = btn.dataset.productHandle;
        const isSaved = (id && self.hasItem(id)) || (handle && self.hasItem(handle));

        if (isSaved) {
          btn.classList.add('active', 'is-active');
          btn.setAttribute('aria-label', 'Remove from wishlist');
        } else {
          btn.classList.remove('active', 'is-active');
          btn.setAttribute('aria-label', 'Add to wishlist');
        }
      });
    },

    updateBadges: function() {
      const count = this.getCount();
      const badges = document.querySelectorAll('.header-wishlist-count');

      badges.forEach(function(badge) {
        badge.textContent = count;
        if (count > 0) {
          badge.classList.add('has-items');
          badge.style.display = 'inline-flex';
          badge.classList.remove('pop');
          void badge.offsetWidth; // trigger reflow for animation
          badge.classList.add('pop');
        } else {
          badge.classList.remove('has-items');
          badge.style.display = 'none';
        }
      });
    },

    dispatchUpdate: function(items) {
      this.updateBadges();
      this.updateButtons();

      const event = new CustomEvent('wishlist:updated', {
        detail: {
          items: items || this.getItems(),
          count: (items || this.getItems()).length
        }
      });
      document.dispatchEvent(event);
    },

    init: function() {
      const self = this;
      this.updateBadges();
      this.updateButtons();

      // Click delegation for any wishlist button
      document.addEventListener('click', function(e) {
        const btn = e.target.closest('[data-wishlist-btn], .card__wishlist-btn, .deal-grid-card__wishlist');
        if (btn) {
          e.preventDefault();
          e.stopPropagation();
          self.toggleItem(btn);
        }
      });

      // Synchronize across browser tabs
      window.addEventListener('storage', function(e) {
        if (e.key === STORAGE_KEY) {
          self.dispatchUpdate();
        }
      });
    }
  };

  window.ThemeWishlist = ThemeWishlist;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      ThemeWishlist.init();
    });
  } else {
    ThemeWishlist.init();
  }
})();
