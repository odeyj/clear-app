import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('loading-spinner')
export class LoadingSpinner extends LitElement {
  static styles = css`
    :host { display: inline-flex; align-items: center; gap: 0.75rem; }
    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.1);
      border-top-color: var(--color-text, #f5f5f7);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .text {
      font-size: 0.8125rem;
      color: var(--color-text-secondary, #a1a1a6);
    }
  `;

  render() {
    return html`
      <div class="spinner"></div>
      <span class="text"><slot>Loading...</slot></span>
    `;
  }
}
