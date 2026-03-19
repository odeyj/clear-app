import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { RiskLevel } from '@frcs/shared';

@customElement('risk-badge')
export class RiskBadge extends LitElement {
  @property() level: RiskLevel = 'low';
  @property({ type: Number }) score: number | null = null;

  static styles = css`
    :host { display: inline-flex; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 0.6875rem;
      font-weight: 600;
      border: 1px solid;
      font-family: var(--font-sans, -apple-system, system-ui, sans-serif);
      -webkit-font-smoothing: antialiased;
    }
    .low { color: #34c759; border-color: #34c759; }
    .moderate { color: #ff9f0a; border-color: #ff9f0a; }
    .high { color: #ff3b30; border-color: #ff3b30; }
    .critical { color: #ff2d55; border-color: #ff2d55; }
  `;

  render() {
    return html`
      <span class="badge ${this.level}">
        ${this.score !== null ? html`${this.score}` : ''}
        ${this.level}
      </span>
    `;
  }
}
