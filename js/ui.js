/**
 * ============================================
 * Handball Club Management - UI Utilities
 * Modals, Toasts, Form Validation, Helpers
 * ============================================
 */

/**
 * ============================================
 * MODAL UTILITIES
 * ============================================
 */
const Modal = {
  /**
   * Open modal
   * @param {string} modalId - Modal element ID
   */
  open(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const backdrop = modal.querySelector('.modal-backdrop') || modal;
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus first input if exists
    const firstInput = modal.querySelector('input, select, textarea');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  },

  /**
   * Close modal
   * @param {string} modalId - Modal element ID
   */
  close(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const backdrop = modal.querySelector('.modal-backdrop') || modal;
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  },

  /**
   * Setup modal close handlers
   * @param {string} modalId - Modal element ID
   */
  setupCloseHandlers(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Close button
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close(modalId));
    }

    // Backdrop click
    const backdrop = modal.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.close(modalId);
        }
      });
    }

    // ESC key
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        this.close(modalId);
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  }
};

/**
 * ============================================
 * TOAST NOTIFICATIONS
 * ============================================
 */
const Toast = {
  container: null,

  /**
   * Initialize toast container
   */
  init() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  },

  /**
   * Show toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
   * @param {number} duration - Auto-close duration in ms (0 = no auto-close)
   */
  show(message, type = 'info', duration = 4000) {
    if (!this.container) this.init();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Close">×</button>
    `;

    // Close button handler
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.remove(toast));

    this.container.appendChild(toast);

    // Auto-close
    if (duration > 0) {
      setTimeout(() => this.remove(toast), duration);
    }
  },

  /**
   * Remove toast
   * @param {HTMLElement} toast - Toast element
   */
  remove(toast) {
    if (!toast) return;
    toast.style.animation = 'slideIn 0.2s ease reverse';
    setTimeout(() => toast.remove(), 200);
  },

  /**
   * Success toast shortcut
   * @param {string} message
   */
  success(message) {
    this.show(message, 'success');
  },

  /**
   * Error toast shortcut
   * @param {string} message
   */
  error(message) {
    this.show(message, 'error');
  },

  /**
   * Warning toast shortcut
   * @param {string} message
   */
  warning(message) {
    this.show(message, 'warning');
  },

  /**
   * Info toast shortcut
   * @param {string} message
   */
  info(message) {
    this.show(message, 'info');
  }
};

/**
 * ============================================
 * FORM VALIDATION
 * ============================================
 */
const FormValidator = {
  /**
   * Validate required fields
   * @param {HTMLFormElement} form - Form element
   * @returns {boolean} Valid status
   */
  validateRequired(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');

    requiredFields.forEach(field => {
      const value = field.value.trim();
      const formGroup = field.closest('.form-group');

      if (!value) {
        isValid = false;
        field.classList.add('error');

        // Add error message if not exists
        let errorEl = formGroup.querySelector('.form-error');
        if (!errorEl) {
          errorEl = document.createElement('div');
          errorEl.className = 'form-error';
          formGroup.appendChild(errorEl);
        }
        errorEl.textContent = 'This field is required';
      } else {
        field.classList.remove('error');
        const errorEl = formGroup.querySelector('.form-error');
        if (errorEl) errorEl.remove();
      }
    });

    return isValid;
  },

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean}
   */
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Clear all validation errors
   * @param {HTMLFormElement} form - Form element
   */
  clearErrors(form) {
    const errorFields = form.querySelectorAll('.error');
    errorFields.forEach(field => field.classList.remove('error'));

    const errorMessages = form.querySelectorAll('.form-error');
    errorMessages.forEach(msg => msg.remove());
  },

  /**
   * Setup real-time validation
   * @param {HTMLFormElement} form - Form element
   */
  setupRealTimeValidation(form) {
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        if (input.hasAttribute('required')) {
          const value = input.value.trim();
          const formGroup = input.closest('.form-group');

          if (!value) {
            input.classList.add('error');
            let errorEl = formGroup.querySelector('.form-error');
            if (!errorEl) {
              errorEl = document.createElement('div');
              errorEl.className = 'form-error';
              formGroup.appendChild(errorEl);
            }
            errorEl.textContent = 'This field is required';
          } else {
            input.classList.remove('error');
            const errorEl = formGroup.querySelector('.form-error');
            if (errorEl) errorEl.remove();
          }
        }
      });
    });
  }
};

/**
 * ============================================
 * TABLE UTILITIES
 * ============================================
 */
const TableHelper = {
  /**
   * Setup sortable table
   * @param {HTMLTableElement} table - Table element
   */
  setupSortable(table) {
    const headers = table.querySelectorAll('th[data-sortable]');

    headers.forEach(header => {
      header.addEventListener('click', () => {
        const column = header.dataset.sortable;
        const isAsc = header.classList.contains('sort-asc');

        // Clear all sort classes
        headers.forEach(h => {
          h.classList.remove('sort-asc', 'sort-desc');
        });

        // Set new sort class
        header.classList.add(isAsc ? 'sort-desc' : 'sort-asc');

        // Sort table
        this.sortTable(table, column, !isAsc);
      });
    });
  },

  /**
   * Sort table by column
   * @param {HTMLTableElement} table - Table element
   * @param {string} column - Column index or key
   * @param {boolean} asc - Ascending order
   */
  sortTable(table, column, asc = true) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    const columnIndex = parseInt(column);

    rows.sort((a, b) => {
      const aCell = a.cells[columnIndex];
      const bCell = b.cells[columnIndex];

      if (!aCell || !bCell) return 0;

      const aText = aCell.textContent.trim();
      const bText = bCell.textContent.trim();

      // Try numeric comparison
      const aNum = parseFloat(aText);
      const bNum = parseFloat(bText);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return asc ? aNum - bNum : bNum - aNum;
      }

      // String comparison
      const comparison = aText.localeCompare(bText);
      return asc ? comparison : -comparison;
    });

    // Re-append sorted rows
    rows.forEach(row => tbody.appendChild(row));
  },

  /**
   * Setup table search/filter
   * @param {HTMLInputElement} searchInput - Search input element
   * @param {HTMLTableElement} table - Table element
   */
  setupSearch(searchInput, table) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const tbody = table.querySelector('tbody');

      if (!tbody) return;

      const rows = tbody.querySelectorAll('tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const matches = text.includes(term);
        row.style.display = matches ? '' : 'none';
      });

      // Show/hide empty state
      const visibleRows = Array.from(rows).filter(r => r.style.display !== 'none');
      const emptyState = table.querySelector('.table-empty');
      if (emptyState) {
        emptyState.style.display = visibleRows.length === 0 ? '' : 'none';
      }
    });
  },

  /**
   * Show empty state
   * @param {HTMLTableElement} table - Table element
   * @param {string} message - Empty message
   */
  showEmpty(table, message = 'No data available') {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    // Clear existing rows
    tbody.innerHTML = '';

    // Add empty state
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
      <td colspan="100" class="table-empty">
        ${message}
      </td>
    `;
    tbody.appendChild(emptyRow);
  },

  /**
   * Populate table from data
   * @param {HTMLTableElement} table - Table element
   * @param {Array} data - Array of data objects
   * @param {Function} renderRow - Function to render row HTML
   */
  populate(table, data, renderRow) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    if (data.length === 0) {
      this.showEmpty(table);
      return;
    }

    tbody.innerHTML = '';
    data.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = renderRow(item);
      tbody.appendChild(row);
    });
  }
};

/**
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 */

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type: 'short', 'long', 'time'
 * @returns {string}
 */
function formatDate(date, format = 'short') {
  const d = new Date(date);

  const options = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    time: { hour: '2-digit', minute: '2-digit' }
  };

  return d.toLocaleDateString('en-US', options[format] || options.short);
}

/**
 * Generate unique ID
 * @param {string} prefix - ID prefix
 * @returns {string}
 */
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Download data as file
 * @param {*} data - Data to download (object or string)
 * @param {string} filename - Filename
 * @param {string} type - MIME type
 */
function downloadFile(data, filename, type = 'application/json') {
  const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Check if user has master access
 * @returns {boolean}
 */
function isMasterAccess() {
  return AuthStore.isMaster();
}

/**
 * Check if user has any access
 * @returns {boolean}
 */
function isLoggedIn() {
  return AuthStore.isLoggedIn();
}

/**
 * Redirect to login if not logged in
 */
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
  }
}

/**
 * Update UI based on access level
 */
function updateUIForAccessLevel() {
  const isMaster = AuthStore.isMaster();

  // Hide/show master-only elements using class ONLY (prevents layout jumps)
  const masterOnly = document.querySelectorAll('[data-master-only]');
  masterOnly.forEach(el => {
    if (isMaster) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  // Hide/show view-only elements using class ONLY
  const viewOnly = document.querySelectorAll('[data-view-only]');
  viewOnly.forEach(el => {
    if (!isMaster) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  // Disable edit/delete buttons for view-only users
  if (!isMaster) {
    const editButtons = document.querySelectorAll('[data-action="edit"], [data-action="delete"]');
    editButtons.forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    });
  }

  // Update sidebar user info
  const userInfo = AuthStore.getUserInfo();
  const userNameEl = document.querySelector('.sidebar-user-name');
  const userRoleEl = document.querySelector('.sidebar-user-role');

  if (userNameEl) userNameEl.textContent = userInfo.name;
  if (userRoleEl) userRoleEl.textContent = userInfo.role;
}

// Auto-initialize Toast on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
  setupMobileMenu();
});

/**
 * ============================================
 * MOBILE MENU TOGGLE
 * ============================================
 */
function setupMobileMenu() {
  const menuToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.querySelector('.sidebar-backdrop');
  
  if (!menuToggle || !sidebar) return;
  
  // Toggle sidebar on menu button click
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
    if (backdrop) {
      backdrop.classList.toggle('active');
    }
  });
  
  // Close sidebar when clicking backdrop
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      backdrop.classList.remove('active');
    });
  }
  
  // Close sidebar when clicking a nav item
  const navItems = sidebar.querySelectorAll('.sidebar-nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      if (backdrop) {
        backdrop.classList.remove('active');
      }
    });
  });
  
  // Close sidebar on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      sidebar.classList.remove('mobile-open');
      if (backdrop) {
        backdrop.classList.remove('active');
      }
    }
  });
}

// Expose to global scope immediately (script is at end of body)
window.Modal = Modal;
window.Toast = Toast;
window.TableHelper = TableHelper;
window.formatDate = formatDate;
window.generateId = generateId;
window.downloadFile = downloadFile;
window.isMasterAccess = isMasterAccess;
window.isLoggedIn = isLoggedIn;
window.requireAuth = requireAuth;
window.updateUIForAccessLevel = updateUIForAccessLevel;
window.setupMobileMenu = setupMobileMenu;

console.log('✅ UI utilities exposed to window');