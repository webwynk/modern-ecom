if (!customElements.get('product-modal')) {
  customElements.define(
    'product-modal',
    class ProductModal extends ModalDialog {
      constructor() {
        super();

        // Prevent ModalDialog's pointerup listener from closing modal on clicks
        // to interactive controls (arrows, zoom button, close button, card content).
        this.addEventListener(
          'pointerup',
          (event) => {
            if (
              event.target.closest(
                '.product-media-modal__lightbox-card, .product-media-modal__header, .product-media-modal__nav-btn, .product-media-modal__btn'
              )
            ) {
              event.stopPropagation();
              event.stopImmediatePropagation();
            }
          },
          true
        );

        this.addEventListener(
          'pointerdown',
          (event) => {
            if (
              event.target.closest(
                '.product-media-modal__lightbox-card, .product-media-modal__header, .product-media-modal__nav-btn, .product-media-modal__btn'
              )
            ) {
              event.stopPropagation();
              event.stopImmediatePropagation();
            }
          },
          true
        );

        this.initLightbox();
      }

      initLightbox() {
        this.counterCurrent = this.querySelector('.product-media-modal__counter-current');
        this.counterTotal = this.querySelector('.product-media-modal__counter-total');
        this.prevBtn = this.querySelector('.product-media-modal__nav-btn--prev');
        this.nextBtn = this.querySelector('.product-media-modal__nav-btn--next');
        this.zoomBtn = this.querySelector('.product-media-modal__btn--zoom');
        this.lightboxContainer = this.querySelector('.product-media-modal__lightbox-container');
        this.lightboxCard = this.querySelector('.product-media-modal__lightbox-card');
        this.content = this.querySelector('.product-media-modal__content');

        this.currentIndex = 0;
        this.mediaItems = [];
        this.touchStartX = 0;
        this.touchEndX = 0;

        if (this.prevBtn) {
          this.prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.prev();
          });
        }

        if (this.nextBtn) {
          this.nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.next();
          });
        }

        if (this.zoomBtn) {
          this.zoomBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.toggleZoom();
          });
        }

        // Clicking the image inside the lightbox card toggles zoom in/out
        if (this.content) {
          this.content.addEventListener('click', (e) => {
            const img = e.target.closest('img');
            if (img) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              this.toggleZoom();
            }
          });
        }

        // Close on clicking backdrop outside the white card
        if (this.lightboxContainer) {
          this.lightboxContainer.addEventListener('click', (e) => {
            if (e.target === this.lightboxContainer) {
              this.hide();
            }
          });
        }

        // Keyboard navigation
        this.addEventListener('keydown', (e) => {
          if (!this.hasAttribute('open')) return;
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.prev();
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.next();
          } else if (e.key === 'Escape') {
            if (this.classList.contains('is-zoomed')) {
              e.preventDefault();
              this.toggleZoom();
            } else {
              this.hide();
            }
          }
        });

        // Touch swipe gestures
        if (this.lightboxCard) {
          this.lightboxCard.addEventListener(
            'touchstart',
            (e) => {
              this.touchStartX = e.changedTouches[0].screenX;
            },
            { passive: true }
          );

          this.lightboxCard.addEventListener(
            'touchend',
            (e) => {
              this.touchEndX = e.changedTouches[0].screenX;
              this.handleSwipe();
            },
            { passive: true }
          );
        }
      }

      handleSwipe() {
        if (this.classList.contains('is-zoomed')) return;
        const threshold = 40;
        const diff = this.touchEndX - this.touchStartX;
        if (diff > threshold) {
          this.prev();
        } else if (diff < -threshold) {
          this.next();
        }
      }

      show(opener) {
        super.show(opener);
        this.classList.remove('is-zoomed');
        if (this.lightboxCard) this.lightboxCard.classList.remove('is-zoomed');
        if (this.zoomBtn) this.zoomBtn.classList.remove('is-active');
        this.refreshMediaList();

        let targetMediaId = opener?.getAttribute('data-media-id');
        if (!targetMediaId) {
          const activePageMedia = document.querySelector('media-gallery .product__media-item.is-active [data-media-id]');
          if (activePageMedia) {
            targetMediaId = activePageMedia.getAttribute('data-media-id');
          }
        }
        let initialIndex = 0;

        if (targetMediaId) {
          const matchIdx = this.mediaItems.findIndex(
            (el) => el.getAttribute('data-media-id') === targetMediaId ||
                    el.getAttribute('data-media-id') === targetMediaId.split('-').pop()
          );
          if (matchIdx !== -1) initialIndex = matchIdx;
        }

        this.setActiveMedia(initialIndex);
      }

      hide() {
        this.classList.remove('is-zoomed');
        if (this.lightboxCard) {
          this.lightboxCard.classList.remove('is-zoomed');
        }
        if (this.zoomBtn) {
          this.zoomBtn.classList.remove('is-active');
        }
        super.hide();
      }

      refreshMediaList() {
        if (!this.content) return;
        this.mediaItems = Array.from(
          this.content.querySelectorAll('[data-media-id]')
        ).filter((el) => !el.closest('.deferred-media__poster'));

        if (this.counterTotal) {
          this.counterTotal.textContent = this.mediaItems.length;
        }
      }

      setActiveMedia(index) {
        if (!this.mediaItems || this.mediaItems.length === 0) return;

        if (index < 0) index = this.mediaItems.length - 1;
        if (index >= this.mediaItems.length) index = 0;

        this.currentIndex = index;

        this.mediaItems.forEach((el, i) => {
          if (i === index) {
            el.classList.add('active');
            const template = el.querySelector('template');
            if (el.nodeName === 'DEFERRED-MEDIA' && template && typeof el.loadContent === 'function') {
              el.loadContent();
            }
          } else {
            el.classList.remove('active');
          }
        });

        if (this.counterCurrent) {
          this.counterCurrent.textContent = this.currentIndex + 1;
        }

        this.classList.remove('is-zoomed');
        if (this.lightboxCard) {
          this.lightboxCard.classList.remove('is-zoomed');
        }
        if (this.zoomBtn) {
          this.zoomBtn.classList.remove('is-active');
        }
      }

      next() {
        this.setActiveMedia(this.currentIndex + 1);
      }

      prev() {
        this.setActiveMedia(this.currentIndex - 1);
      }

      toggleZoom() {
        const isZoomed = this.classList.toggle('is-zoomed');
        if (this.lightboxCard) {
          this.lightboxCard.classList.toggle('is-zoomed', isZoomed);
        }
        if (this.zoomBtn) {
          this.zoomBtn.classList.toggle('is-active', isZoomed);
        }
      }
    }
  );
}
