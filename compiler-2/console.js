class CustomConsole {
  constructor(parentElement, options = {}) {
    const defaultOptions = {
      width: '100%',
      height: '100%',
      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--console-bg') || '#222',
      textColor: getComputedStyle(document.documentElement).getPropertyValue('--console-text') || '#f0f0f0',
      fontFamily: 'monospace',
      fontSize: '14px',
      logLevels: ['log', 'info', 'warn', 'error'],
    };

    this.options = { ...defaultOptions, ...options };
    this.logs = [];
    this.groups = [];
    this.counts = {};
    this.filter = null;
    this.filterText = '';
    this._createUI(parentElement);
    this._overrideConsole();
    this._attachGlobalErrorHandler();
  }

  _createUI(parent) {
    this.container = document.createElement('div');
    this.container.className = 'custom-console';
    Object.assign(this.container.style, {
      width: this.options.width,
      height: this.options.height,
      fontFamily: this.options.fontFamily,
      fontSize: this.options.fontSize,
      backgroundColor: this.options.backgroundColor,
      color: this.options.textColor,
      display: 'flex',
      flexDirection: 'column',
    });


    this.controls = document.createElement('div');
    this.controls.className = 'console-controls';
    this.controls.style.padding = '8px';
    this.controls.style.borderBottom = `1px solid ${this.options.textColor}`;
    this.container.appendChild(this.controls);

    const filterLabel = document.createElement('span');
    filterLabel.textContent = 'Controls:';
    filterLabel.style.marginRight = '5px';
    filterLabel.style.alignContent = 'center';
    this.controls.appendChild(filterLabel);

    this.options.logLevels.forEach(level => {
      const btn = document.createElement('button');
      btn.textContent = level;
      btn.dataset.type = level;
      btn.style.marginRight = '5px';
      btn.style.padding = '5px 10px';
      btn.style.border = `1px solid ${this.options.textColor}`;
      btn.style.backgroundColor = 'transparent';
      btn.style.color = this.options.textColor;
      btn.style.cursor = 'pointer';
      btn.classList.add('filter-button');
      btn.onclick = () => this._filterLogs(level);
      this.controls.appendChild(btn);
    });

    const allButton = document.createElement('button');
    allButton.textContent = 'all';
    allButton.style.marginRight = '10px';
    allButton.style.padding = '5px 10px';
    allButton.style.border = `1px solid ${this.options.textColor}`;
    allButton.style.backgroundColor = 'transparent';
    allButton.style.color = this.options.textColor;
    allButton.style.cursor = 'pointer';
    allButton.onclick = () => this._filterLogs(null);
    this.controls.appendChild(allButton);

    
    this.clearButton = document.createElement('button');
    this.clearButton.textContent = 'clear';
    this.clearButton.style.padding = '5px 10px';
    this.clearButton.style.border = `1px solid ${this.options.textColor}`;
    this.clearButton.style.backgroundColor = 'transparent';
    this.clearButton.style.color = this.options.textColor;
    this.clearButton.style.cursor = 'pointer';
    this.clearButton.onclick = () => this.clearLogs();
    this.controls.appendChild(this.clearButton);
    
    this.textFilterInput = document.createElement('input');
    this.textFilterInput.type = 'text';
    this.textFilterInput.placeholder = 'Filter text';
    this.textFilterInput.style.padding = '5px';
    this.textFilterInput.style.marginRight = '10px';
    this.textFilterInput.style.backgroundColor = '#333';
    this.textFilterInput.style.color = this.options.textColor;
    this.textFilterInput.style.border = `1px solid ${this.options.textColor}`;
    this.textFilterInput.addEventListener('input', (e) => {
      this.filterText = e.target.value.toLowerCase();
      this._applyFilters();
    });
    this.controls.appendChild(this.textFilterInput);
    
    this.output = document.createElement('div');
    this.output.className = 'console-output';
    this.output.style.flexGrow = '1';
    this.output.style.overflowY = 'auto';
    this.output.style.padding = '8px';
    this.container.appendChild(this.output);

    parent.appendChild(this.container);
  }

  _createLogEntry(type, ...args) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.dataset.type = type;
    entry.style.marginBottom = '4px';
    entry.style.padding = '4px';
    entry.style.borderBottom = `1px dotted ${this.options.textColor}`;

    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', millisecond: '3-digit' });
    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'timestamp';
    timestampSpan.textContent = `${timestamp}: `;
    timestampSpan.style.color = '#aaa';
    timestampSpan.style.marginRight = '8px';
    entry.appendChild(timestampSpan);

    args.forEach(arg => {
      entry.appendChild(this._formatArg(arg));
      const spacer = document.createTextNode(' ');
      entry.appendChild(spacer);
    });

    return entry;
  }

  _log(type, ...args) {
    const entry = this._createLogEntry(type, ...args);
    this.logs.push(entry);

    this._appendLogEntry(entry);
  }

  _appendLogEntry(entry) {
    if (this.filter && entry.dataset.type !== this.filter) {
      return;
    }
    if (this.filterText && !entry.textContent.toLowerCase().includes(this.filterText)) {
      return;
    }

    if (this.groups.length > 0) {
      const group = this.groups[this.groups.length - 1];
      group.appendChild(entry);
    } else {
      this.output.appendChild(entry);
      this.output.scrollTop = this.output.scrollHeight;
    }
  }

  _formatArg(arg) {
    const span = document.createElement('span');

    if (arg === null) {
      span.textContent = 'null';
    } else if (typeof arg === 'object') {
      try {
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = Array.isArray(arg) ? `[Array(${arg.length})]` : '[Object]';
        summary.style.cursor = 'pointer';
        details.appendChild(summary);

        const pre = document.createElement('pre');
        pre.textContent = JSON.stringify(arg, null, 2);
        pre.style.margin = '0';
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.fontFamily = this.options.fontFamily;
        pre.style.fontSize = this.options.fontSize;
        pre.style.backgroundColor = '#333';
        pre.style.padding = '8px';
        pre.style.borderRadius = '4px';
        details.appendChild(pre);
        span.appendChild(details);
      } catch (e) {
        if (e instanceof TypeError && e.message.includes('circular structure')) {
          span.textContent = `{Converting circular structure to JSON: ${e.message}}`;
          span.style.color = 'orange';
        } else {
          span.textContent = '[Object could not be displayed]';
          span.style.color = 'red';
          console.error("Error during JSON.stringify:", e);
        }
      }
    } else if (typeof arg === 'undefined') {
      span.textContent = 'undefined';
    } else {
      span.textContent = arg;
    }
    return span;
  }

  _filterLogs(type) {
    this.filter = type;
    this._applyFilters();
  }

  _applyFilters() {
    this.output.innerHTML = '';
    this.logs.forEach(logEntry => {
      if (!this.filter || logEntry.dataset.type === this.filter) {
        if (!this.filterText || logEntry.textContent.toLowerCase().includes(this.filterText)) {
          if (this.groups.length > 0 && this.groups.includes(logEntry.parentNode)) {
            this.groups[this.groups.length - 1].appendChild(logEntry);
          } else if (this.groups.length === 0 || !this.groups.includes(logEntry.parentNode)) {
            this.output.appendChild(logEntry);
          }
        }
      }
    });
    this.output.scrollTop = this.output.scrollHeight;
  }

  clearLogs() {
    this.output.innerHTML = '';
    this.logs = [];
    this.groups = [];
    this.counts = {};
  }

  _overrideConsole() {
    const originalConsole = { ...window.console };

    const logWrapper = (type) => (...args) => {
      this._log(type, ...args);
      originalConsole[type](...args);
    };

    window.console.log = logWrapper('log');
    window.console.info = logWrapper('info');
    window.console.warn = logWrapper('warn');
    window.console.error = logWrapper('error');
    window.console.debug = logWrapper('log');

    window.console.group = (label) => {
      const group = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = label;
      summary.style.cursor = 'pointer';
      group.style.marginLeft = `${this.groups.length * 10}px`;
      this.output.appendChild(group);
      this.groups.push(group);
      originalConsole.group(label);
    };

    window.console.groupEnd = () => {
      this.groups.pop();
      originalConsole.groupEnd();
    };

    window.console.count = (label = 'default') => {
      if (!this.counts[label]) this.counts[label] = 0;
      this.counts[label]++;
      this._log('info', `count ${label}: ${this.counts[label]}`);
      originalConsole.count(label);
    };

    window.console.countReset = (label = 'default') => {
      this.counts[label] = 0;
      this._log('info', `count reset ${label}`);
      originalConsole.countReset(label);
    };

    window.console.table = (data) => {
      const table = document.createElement('table');
      table.style.borderCollapse = 'collapse';
      table.style.margin = '8px 0';
      table.style.color = this.options.textColor;
      table.style.fontFamily = this.options.fontFamily;
      table.style.fontSize = this.options.fontSize;

      if (Array.isArray(data) && data.length > 0) {
        const keys = Object.keys(data[0]);
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        keys.forEach(key => {
          const th = document.createElement('th');
          th.textContent = key;
          th.style.border = `1px solid ${this.options.textColor}`;
          th.style.padding = '5px';
          th.style.textAlign = 'left';
          th.style.backgroundColor = '#333';
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        data.forEach(item => {
          const row = document.createElement('tr');
          keys.forEach(key => {
            const td = document.createElement('td');
            td.textContent = item[key];
            td.style.border = `1px solid ${this.options.textColor}`;
            td.style.padding = '5px';
            row.appendChild(td);
          });
          tbody.appendChild(row);
        });
        table.appendChild(tbody);
        this._log('log', table);
      } else if (typeof data === 'object' && data !== null) {
        const keys = Object.keys(data);
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const thKey = document.createElement('th');
        thKey.textContent = '(index)';
        thKey.style.border = `1px solid ${this.options.textColor}`;
        thKey.style.padding = '5px';
        thKey.style.textAlign = 'left';
        thKey.style.backgroundColor = '#333';
        headerRow.appendChild(thKey);
        const thValue = document.createElement('th');
        thValue.textContent = 'Value';
        thValue.style.border = `1px solid ${this.options.textColor}`;
        thValue.style.padding = '5px';
        thValue.style.textAlign = 'left';
        thValue.style.backgroundColor = '#333';
        headerRow.appendChild(thValue);
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        keys.forEach(key => {
          const row = document.createElement('tr');
          const tdKey = document.createElement('td');
          tdKey.textContent = key;
          tdKey.style.border = `1px solid ${this.options.textColor}`;
          tdKey.style.padding = '5px';
          row.appendChild(tdKey);
          const tdValue = document.createElement('td');
          tdValue.textContent = data[key];
          tdValue.style.border = `1px solid ${this.options.textColor}`;
          tdValue.style.padding = '5px';
          row.appendChild(tdValue);
          tbody.appendChild(row);
        });
        table.appendChild(tbody);
        this._log('log', table);
      } else {
        this._log('info', 'console.table: Data is not an array or object.');
      }
      originalConsole.table(data);
    };
  }

  _attachGlobalErrorHandler() {
    window.onerror = (msg, src, line, col, error) => {
      this._log('error', `Uncaught: ${msg}`, `at ${src}:${line}:${col}`);
      if (error && error.stack) {
        this._log('error', error.stack);
      }
      return true;
    };
  }
}
const container = document.getElementById('console');
const ustomConsole = new CustomConsole(container);

window.addEventListener('message', (event) => {

  if (event.data?.type === 'iframe-console') {
    const { logType, args } = event.data;
    ustomConsole._log(logType, ...args);
  }
});