class PredictiveSearch extends SearchForm {
  constructor() {
    super();
    this.cachedResults = {};
    this.predictiveSearchResults = this.querySelector('[data-predictive-search]');
    this.allPredictiveSearchInstances = document.querySelectorAll('predictive-search');
    this.isOpen = false;
    this.abortController = new AbortController();
    this.searchTerm = '';

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.input.form.addEventListener('submit', this.onFormSubmit.bind(this));

    this.input.addEventListener('focus', this.onFocus.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.addEventListener('keyup', this.onKeyup.bind(this));
    this.addEventListener('keydown', this.onKeydown.bind(this));

    this.predictiveSearchResults.addEventListener('click', (event) => {
      const termButton = event.target.closest('#predictive-search-option-search-keywords button, .predictive-search__item--term');
      if (termButton) {
        this.input.form.submit();
      }
    });
  }

  getQuery() {
    return this.input.value.trim();
  }

  onChange() {
    super.onChange();
    const newSearchTerm = this.getQuery();
    if (!this.searchTerm || !newSearchTerm.startsWith(this.searchTerm)) {
      // Remove the results when they are no longer relevant for the new search term
      // so they don't show up when the dropdown opens again
      this.querySelector('#predictive-search-results-groups-wrapper')?.remove();
    }

    // Update the term asap, don't wait for the predictive search query to finish loading
    this.updateSearchForTerm(this.searchTerm, newSearchTerm);

    this.searchTerm = newSearchTerm;

    if (!this.searchTerm.length) {
      this.close(true);
      return;
    }

    this.getSearchResults(this.searchTerm);
  }

  onFormSubmit(event) {
    if (!this.getQuery().length || this.querySelector('[aria-selected="true"] a')) event.preventDefault();
  }

  onFormReset(event) {
    super.onFormReset(event);
    if (super.shouldResetForm()) {
      this.searchTerm = '';
      this.abortController.abort();
      this.abortController = new AbortController();
      this.closeResults(true);
    }
  }

  onFocus() {
    const currentSearchTerm = this.getQuery();

    if (!currentSearchTerm.length) return;

    if (this.searchTerm !== currentSearchTerm) {
      // Search term was changed from other search input, treat it as a user change
      this.onChange();
    } else if (this.getAttribute('results') === 'true') {
      this.open();
    } else {
      this.getSearchResults(this.searchTerm);
    }
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onKeyup(event) {
    if (!this.getQuery().length) this.close(true);
    event.preventDefault();

    switch (event.code) {
      case 'ArrowUp':
        this.switchOption('up');
        break;
      case 'ArrowDown':
        this.switchOption('down');
        break;
      case 'Enter':
        this.selectOption();
        break;
    }
  }

  onKeydown(event) {
    // Prevent the cursor from moving in the input when using the up and down arrow keys
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      event.preventDefault();
    }
  }

  updateSearchForTerm(previousTerm, newTerm) {
    const searchForTextElement = this.querySelector('[data-predictive-search-search-for-text]');
    const currentButtonText = searchForTextElement?.innerText;
    if (currentButtonText) {
      if (currentButtonText.match(new RegExp(previousTerm, 'g')).length > 1) {
        // The new term matches part of the button text and not just the search term, do not replace to avoid mistakes
        return;
      }
      const newButtonText = currentButtonText.replace(previousTerm, newTerm);
      searchForTextElement.innerText = newButtonText;
    }
  }

  switchOption(direction) {
    if (!this.getAttribute('open')) return;

    const moveUp = direction === 'up';
    const selectedElement = this.querySelector('[aria-selected="true"]');

    // Filter out hidden elements (duplicated page and article resources) thanks
    // to this https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
    const allVisibleElements = Array.from(this.querySelectorAll('li, button.predictive-search__item')).filter(
      (element) => element.offsetParent !== null
    );
    let activeElementIndex = 0;

    if (moveUp && !selectedElement) return;

    let selectedElementIndex = -1;
    let i = 0;

    while (selectedElementIndex === -1 && i <= allVisibleElements.length) {
      if (allVisibleElements[i] === selectedElement) {
        selectedElementIndex = i;
      }
      i++;
    }

    this.statusElement.textContent = '';

    if (!moveUp && selectedElement) {
      activeElementIndex = selectedElementIndex === allVisibleElements.length - 1 ? 0 : selectedElementIndex + 1;
    } else if (moveUp) {
      activeElementIndex = selectedElementIndex === 0 ? allVisibleElements.length - 1 : selectedElementIndex - 1;
    }

    if (activeElementIndex === selectedElementIndex) return;

    const activeElement = allVisibleElements[activeElementIndex];

    activeElement.setAttribute('aria-selected', true);
    if (selectedElement) selectedElement.setAttribute('aria-selected', false);

    this.input.setAttribute('aria-activedescendant', activeElement.id);
  }

  selectOption() {
    const selectedOption = this.querySelector('[aria-selected="true"] a, button[aria-selected="true"]');

    if (selectedOption) selectedOption.click();
  }

  getSearchResults(searchTerm) {
    const queryKey = searchTerm.replace(' ', '-').toLowerCase();
    this.setLiveRegionLoadingState();

    if (this.cachedResults[queryKey]) {
      this.renderSearchResults(this.cachedResults[queryKey]);
      const searchDeferred = this.dispatchSearchUpdateEvent(searchTerm);
      searchDeferred?.resolve({ totalCount: this.getTotalResultCount() });
      return;
    }

    const searchDeferred = this.dispatchSearchUpdateEvent(searchTerm);

    const predictiveBase = (typeof routes !== 'undefined' && routes.predictive_search_url) || (window.routes && window.routes.predictive_search_url) || '/search/suggest';
    const searchBase = (typeof routes !== 'undefined' && routes.search_url) || (window.routes && window.routes.search_url) || '/search';

    const predictiveUrl = `${predictiveBase}?q=${encodeURIComponent(searchTerm)}&resources[limit]=10&resources[limit_scope]=each&section_id=predictive-search`;
    const productsUrl = `${searchBase}?q=${encodeURIComponent(searchTerm)}&type=product&view=predictive-products`;

    Promise.all([
      fetch(predictiveUrl, { signal: this.abortController.signal }).then((res) => (res.ok ? res.text() : '')),
      fetch(productsUrl, { signal: this.abortController.signal }).then((res) => (res.ok ? res.text() : '')).catch(() => '')
    ])
      .then(([predictiveText, productsText]) => {
        if (!predictiveText) {
          this.close();
          return;
        }

        const predictiveDoc = new DOMParser().parseFromString(predictiveText, 'text/html');
        const sectionContent = predictiveDoc.querySelector('#shopify-section-predictive-search');
        if (!sectionContent) {
          this.close();
          return;
        }

        const stopWords = new Set(['the', 'and', 'a', 'an', 'in', 'of', 'for', 'with', 'to', 'or', 'by', 'at']);
        const queryTokens = searchTerm.toLowerCase().trim().split(/\s+/).filter((w) => !stopWords.has(w) && w.length > 0);

        let finalProductCount = 0;

        if (productsText) {
          const productsDoc = new DOMParser().parseFromString(productsText, 'text/html');
          const ajaxProductsList = productsDoc.querySelector('#predictive-search-results-products-list');
          const totalDataEl = productsDoc.querySelector('#predictive-products-data');
          const totalCount = parseInt(totalDataEl?.dataset.totalCount) || 0;

          if (ajaxProductsList && totalCount > 0) {
            const rawItems = Array.from(ajaxProductsList.querySelectorAll('.predictive-search__list-item'));

            // Strict token validation: require every significant query token to match in keywords
            const filteredItems = rawItems.filter((item) => {
              const keywords = (item.dataset.searchKeywords || item.textContent || '').toLowerCase();
              return queryTokens.every((token) => keywords.includes(token));
            });

            if (filteredItems.length > 0) {
              ajaxProductsList.innerHTML = '';
              filteredItems.forEach((item, index) => {
                item.setAttribute('data-product-index', index);
                if (index >= 5) {
                  item.style.display = 'none';
                } else {
                  item.style.display = '';
                }
                ajaxProductsList.appendChild(item);
              });

              finalProductCount = filteredItems.length;

              const existingList = sectionContent.querySelector('#predictive-search-results-products-list');
              if (existingList) {
                existingList.replaceWith(ajaxProductsList);
              }

              const header = sectionContent.querySelector('.predictive-search__products-header');
              const totalPages = Math.ceil(finalProductCount / 5);

              if (header) {
                let paginationContainer = header.querySelector('[data-predictive-search-pagination]');
                if (finalProductCount > 5) {
                  if (paginationContainer) {
                    const counter = paginationContainer.querySelector('[data-pagination-counter]');
                    if (counter) counter.textContent = `1/${totalPages}`;
                    const prevBtn = paginationContainer.querySelector('[data-pagination-action="prev"]');
                    const nextBtn = paginationContainer.querySelector('[data-pagination-action="next"]');
                    if (prevBtn) prevBtn.disabled = true;
                    if (nextBtn) nextBtn.disabled = false;
                  } else {
                    const paginationHtml = `
                      <div class="predictive-search__pagination" data-predictive-search-pagination>
                        <button type="button" class="predictive-search__pagination-btn predictive-search__pagination-btn--prev" data-pagination-action="prev" aria-label="Previous products" tabindex="-1" disabled>
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                        <span class="predictive-search__pagination-counter" data-pagination-counter aria-live="polite">1/${totalPages}</span>
                        <button type="button" class="predictive-search__pagination-btn predictive-search__pagination-btn--next" data-pagination-action="next" aria-label="Next products" tabindex="-1">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                      </div>`;
                    header.insertAdjacentHTML('beforeend', paginationHtml);
                  }
                } else if (paginationContainer) {
                  paginationContainer.remove();
                }
              }
            } else {
              // 0 items satisfy all search tokens! Remove the products result group from markup
              const productsGroup = sectionContent.querySelector('#predictive-search-results-products-list')?.closest('.predictive-search__result-group');
              if (productsGroup) {
                productsGroup.remove();
              }
            }
          }
        }

        // Check if any suggestions or valid products exist
        const queriesList = sectionContent.querySelector('#predictive-search-results-queries-list');
        const hasSuggestions = queriesList && queriesList.children.length > 0;
        const hasValidProducts = finalProductCount > 0;

        if (!hasValidProducts && !hasSuggestions) {
          const wrapper = sectionContent.querySelector('.predictive-search__results-groups-wrapper');
          const emptyCard = `
            <div class="predictive-search__empty-state" data-predictive-empty-state>
              <div class="predictive-search__empty-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </div>
              <p class="predictive-search__empty-heading">No exact matches for <span>"${this.escapeHtml(searchTerm)}"</span></p>
              <p class="predictive-search__empty-subtext">Check your spelling, or explore our most popular categories:</p>
              <div class="predictive-search__empty-tags">
                <a href="/collections/all" class="predictive-search__empty-tag">All Rugs</a>
                <a href="/collections/special-collection" class="predictive-search__empty-tag">Special Deals 🔥</a>
                <a href="/collections/handmade-rugs" class="predictive-search__empty-tag">Handmade Rugs</a>
                <a href="/collections/4-x-6-rugs" class="predictive-search__empty-tag">4 x 6 Rugs</a>
                <a href="/collections/3x5-rug" class="predictive-search__empty-tag">3x5 Rugs</a>
                <a href="/collections/small-rugs" class="predictive-search__empty-tag">Small Rugs</a>
                <a href="/collections/office-chairs" class="predictive-search__empty-tag">Office Chairs</a>
              </div>
            </div>`;

          if (wrapper) {
            wrapper.innerHTML = emptyCard;
            wrapper.className = 'predictive-search__results-groups-wrapper predictive-search__results-groups-wrapper--empty-state';
          } else {
            sectionContent.insertAdjacentHTML('afterbegin', emptyCard);
          }
        }

        const resultsMarkup = sectionContent.innerHTML;
        // Save bandwidth keeping the cache in all instances synced
        this.allPredictiveSearchInstances.forEach((predictiveSearchInstance) => {
          predictiveSearchInstance.cachedResults[queryKey] = resultsMarkup;
        });
        this.renderSearchResults(resultsMarkup);

        searchDeferred?.resolve({ totalCount: this.getTotalResultCount() });
      })
      .catch((error) => {
        if (error?.code === 20) {
          // Code 20 means the call was aborted
          searchDeferred?.reject(error);
          return;
        }
        searchDeferred?.reject(error);
        this.close();
        throw error;
      });
  }

  getTotalResultCount() {
    return parseInt(this.predictiveSearchResults.querySelector('[data-total-results]')?.dataset.totalResults) || 0;
  }

  escapeHtml(string) {
    if (!string) return '';
    const div = document.createElement('div');
    div.textContent = string;
    return div.innerHTML;
  }

  dispatchSearchUpdateEvent(query) {
    const { SearchUpdateEvent } = window.StandardEvents || {};
    if (!SearchUpdateEvent) return null;

    const deferred = SearchUpdateEvent.createPromise();
    this.dispatchEvent(
      new SearchUpdateEvent({
        search: { query },
        promise: deferred.promise,
      })
    );
    return deferred;
  }

  setLiveRegionLoadingState() {
    this.statusElement = this.statusElement || this.querySelector('.predictive-search-status');
    this.loadingText = this.loadingText || this.getAttribute('data-loading-text');

    this.setLiveRegionText(this.loadingText);
    this.setAttribute('loading', true);
  }

  setLiveRegionText(statusText) {
    this.statusElement.setAttribute('aria-hidden', 'false');
    this.statusElement.textContent = statusText;

    setTimeout(() => {
      this.statusElement.setAttribute('aria-hidden', 'true');
    }, 1000);
  }

  renderSearchResults(resultsMarkup) {
    this.predictiveSearchResults.innerHTML = resultsMarkup;
    this.setAttribute('results', true);

    this.predictiveSearchResults.scrollTop = 0;
    this.initPagination();
    this.setLiveRegionResults();
    this.open();
  }

  initPagination() {
    const productsList = this.querySelector('#predictive-search-results-products-list');
    const paginationContainer = this.querySelector('[data-predictive-search-pagination]');
    if (!productsList || !paginationContainer) return;

    paginationContainer.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });

    const items = Array.from(productsList.querySelectorAll('.predictive-search__list-item'));
    items.forEach((item, index) => {
      item.setAttribute('data-product-index', index);
    });

    const pageSize = 5;
    const totalItems = items.length;

    if (totalItems <= pageSize) {
      paginationContainer.style.display = 'none';
      items.forEach((item) => (item.style.display = ''));
      return;
    }

    paginationContainer.style.display = 'flex';

    let currentPage = 1;
    const totalPages = Math.ceil(totalItems / pageSize);

    const updatePage = (page) => {
      currentPage = page;
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      items.forEach((item, index) => {
        if (index >= startIndex && index < endIndex) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });

      const currentCounter = paginationContainer.querySelector('[data-pagination-counter]');
      const currentPrevBtn = paginationContainer.querySelector('[data-pagination-action="prev"]');
      const currentNextBtn = paginationContainer.querySelector('[data-pagination-action="next"]');

      if (currentCounter) {
        currentCounter.textContent = `${currentPage}/${totalPages}`;
      }

      if (currentPrevBtn) {
        currentPrevBtn.disabled = currentPage <= 1;
      }
      if (currentNextBtn) {
        currentNextBtn.disabled = currentPage >= totalPages;
      }

      this.predictiveSearchResults.scrollTop = 0;
    };

    const prevBtn = paginationContainer.querySelector('[data-pagination-action="prev"]');
    const nextBtn = paginationContainer.querySelector('[data-pagination-action="next"]');

    if (prevBtn && nextBtn) {
      const newPrevBtn = prevBtn.cloneNode(true);
      const newNextBtn = nextBtn.cloneNode(true);
      prevBtn.replaceWith(newPrevBtn);
      nextBtn.replaceWith(newNextBtn);

      newPrevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentPage > 1) {
          updatePage(currentPage - 1);
        }
      });

      newNextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentPage < totalPages) {
          updatePage(currentPage + 1);
        }
      });
    }

    updatePage(1);
  }

  setLiveRegionResults() {
    this.removeAttribute('loading');
    this.setLiveRegionText(this.querySelector('[data-predictive-search-live-region-count-value]').textContent);
  }

  getResultsMaxHeight() {
    this.resultsMaxHeight =
      window.innerHeight - document.querySelector('.section-header')?.getBoundingClientRect().bottom;
    return this.resultsMaxHeight;
  }

  open() {
    this.predictiveSearchResults.style.maxHeight = this.resultsMaxHeight || `${this.getResultsMaxHeight()}px`;
    this.setAttribute('open', true);
    this.input.setAttribute('aria-expanded', true);
    this.isOpen = true;
  }

  close(clearSearchTerm = false) {
    this.closeResults(clearSearchTerm);
    this.isOpen = false;
  }

  closeResults(clearSearchTerm = false) {
    if (clearSearchTerm) {
      this.input.value = '';
      this.removeAttribute('results');
    }
    const selected = this.querySelector('[aria-selected="true"]');

    if (selected) selected.setAttribute('aria-selected', false);

    this.input.setAttribute('aria-activedescendant', '');
    this.removeAttribute('loading');
    this.removeAttribute('open');
    this.input.setAttribute('aria-expanded', false);
    this.resultsMaxHeight = false;
    this.predictiveSearchResults.removeAttribute('style');
  }
}

customElements.define('predictive-search', PredictiveSearch);
