import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from '../../styles/shared-styles.js';
import { api } from '../../services/api-client.js';
import type { AirportSearchResult } from '@frcs/shared';

@customElement('route-input')
export class RouteInput extends LitElement {
  @state() private origin = '';
  @state() private destination = '';
  @state() private originCode = '';
  @state() private destCode = '';
  @state() private originSuggestions: AirportSearchResult[] = [];
  @state() private destSuggestions: AirportSearchResult[] = [];
  @state() private activeField: 'origin' | 'dest' | null = null;

  static styles = [sharedStyles, css`
    :host { display: block; }
    .form-card {
      background: var(--color-surface, #2c2c2e);
      border: 1px solid var(--color-border-strong, rgba(255,255,255,0.14));
      border-radius: var(--radius-2xl, 20px);
      padding: var(--space-5, 1.25rem);
    }
    .fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3, 0.75rem);
      margin-bottom: var(--space-3, 0.75rem);
    }
    .field {
      position: relative;
    }
    .field-inner {
      background: var(--color-surface-elevated, #3a3a3c);
      border: 1px solid var(--color-border, rgba(255,255,255,0.08));
      border-radius: var(--radius-lg, 12px);
      padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
      transition: border-color var(--duration-fast, 0.15s) var(--ease-default);
    }
    .field-inner:focus-within {
      border-color: rgba(255,255,255,0.24);
    }
    label {
      display: block;
      font-size: var(--text-xs, 0.6875rem);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-text-muted, #6e6e73);
      font-weight: 500;
      margin-bottom: var(--space-1, 0.25rem);
    }
    input {
      width: 100%;
      padding: 0;
      border: none;
      background: transparent;
      font-size: var(--text-lg, 1.0625rem);
      font-weight: 600;
      color: var(--color-text, #f5f5f7);
      font-family: inherit;
      outline: none;
    }
    input::placeholder {
      color: var(--color-text-muted, #6e6e73);
      font-weight: 400;
    }
    .suggestions {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: var(--color-surface-elevated, #3a3a3c);
      border: 1px solid var(--color-border-strong, rgba(255,255,255,0.14));
      border-radius: var(--radius-lg, 12px);
      box-shadow: var(--shadow-lg, 0 8px 28px rgba(0,0,0,0.5));
      z-index: 10;
      max-height: 220px;
      overflow-y: auto;
      padding: var(--space-1, 0.25rem);
    }
    .suggestion {
      padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--text-sm, 0.8125rem);
      border-radius: var(--radius, 8px);
      transition: background var(--duration-fast, 0.15s) var(--ease-default);
    }
    .suggestion:hover { background: rgba(255,255,255,0.06); }
    .suggestion .name {
      color: var(--color-text, #f5f5f7);
      font-weight: 500;
    }
    .suggestion .code {
      font-family: var(--font-mono, monospace);
      font-weight: 600;
      color: var(--color-text-muted, #6e6e73);
      font-size: var(--text-xs, 0.6875rem);
    }
    .submit-btn {
      width: 100%;
      padding: var(--space-3, 0.75rem);
      border: 1px solid var(--color-border-strong, rgba(255,255,255,0.14));
      border-radius: var(--radius-lg, 12px);
      background: transparent;
      color: var(--color-text, #f5f5f7);
      font-size: var(--text-base, 0.9375rem);
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all var(--duration-fast, 0.15s) var(--ease-default);
      -webkit-font-smoothing: antialiased;
    }
    .submit-btn:hover {
      background: var(--color-surface-elevated, #3a3a3c);
      border-color: rgba(255,255,255,0.22);
    }
    .submit-btn:active {
      transform: scale(0.98);
    }
  `];

  private debounceTimer: number | null = null;

  private async handleInput(field: 'origin' | 'dest', value: string) {
    if (field === 'origin') {
      this.origin = value;
      this.originCode = '';  // clear code when user types
    } else {
      this.destination = value;
      this.destCode = '';
    }

    this.activeField = field;

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (value.length < 2) {
      if (field === 'origin') this.originSuggestions = [];
      else this.destSuggestions = [];
      return;
    }

    this.debounceTimer = window.setTimeout(async () => {
      const results = await api.searchAirports(value);
      if (field === 'origin') this.originSuggestions = results;
      else this.destSuggestions = results;
    }, 200);
  }

  private selectAirport(field: 'origin' | 'dest', airport: AirportSearchResult) {
    const displayName = airport.municipality || airport.name;
    if (field === 'origin') {
      this.origin = displayName;
      this.originCode = airport.iataCode;
      this.originSuggestions = [];
    } else {
      this.destination = displayName;
      this.destCode = airport.iataCode;
      this.destSuggestions = [];
    }
    this.activeField = null;
  }

  private handleSubmit(e: Event) {
    e.preventDefault();
    if (!this.originCode || !this.destCode) return;
    this.originSuggestions = [];
    this.destSuggestions = [];
    this.dispatchEvent(new CustomEvent('scan', {
      detail: { origin: this.originCode.toUpperCase(), destination: this.destCode.toUpperCase() },
      bubbles: true,
      composed: true,
    }));
  }

  private renderSuggestions(field: 'origin' | 'dest') {
    const suggestions = field === 'origin' ? this.originSuggestions : this.destSuggestions;
    if (this.activeField !== field || suggestions.length === 0) return null;
    return html`
      <div class="suggestions">
        ${suggestions.map(s => html`
          <div class="suggestion" @click=${() => this.selectAirport(field, s)}>
            <span class="name">${s.municipality || s.name}, ${s.country}</span>
            <span class="code">${s.iataCode}</span>
          </div>
        `)}
      </div>
    `;
  }

  render() {
    return html`
      <form class="form-card" @submit=${this.handleSubmit}>
        <div class="fields">
          <div class="field">
            <div class="field-inner">
              <label>From</label>
              <input
                type="text"
                placeholder="Singapore"
                .value=${this.origin}
                @input=${(e: Event) => this.handleInput('origin', (e.target as HTMLInputElement).value)}
                @focus=${() => this.activeField = 'origin'}
              />
            </div>
            ${this.renderSuggestions('origin')}
          </div>
          <div class="field">
            <div class="field-inner">
              <label>To</label>
              <input
                type="text"
                placeholder="Destination"
                .value=${this.destination}
                @input=${(e: Event) => this.handleInput('dest', (e.target as HTMLInputElement).value)}
                @focus=${() => this.activeField = 'dest'}
              />
            </div>
            ${this.renderSuggestions('dest')}
          </div>
        </div>
        <button type="submit" class="submit-btn">Analyze route</button>
      </form>
    `;
  }
}
