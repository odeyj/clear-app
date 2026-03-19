import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sharedStyles } from '../../styles/shared-styles.js';
import type { AirlineProfile } from '@frcs/shared';
import '../common/risk-badge.js';

@customElement('airline-profiles')
export class AirlineProfiles extends LitElement {
  @property({ type: Array }) profiles: AirlineProfile[] = [];

  static styles = [sharedStyles, css`
    :host { display: block; }
    .header {
      font-size: var(--text-lg, 1.0625rem);
      font-weight: 700;
      color: var(--color-text, #f5f5f7);
      margin-bottom: var(--space-4, 1rem);
    }
    .profile {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-5, 1.25rem);
      background: var(--color-surface, #2c2c2e);
      border: 1px solid var(--color-border, rgba(255,255,255,0.08));
      border-radius: var(--radius-lg, 12px);
      margin-bottom: var(--space-3, 0.75rem);
      transition: border-color var(--duration-fast, 0.15s) var(--ease-default);
    }
    .profile:hover {
      border-color: rgba(255,255,255,0.18);
    }
    .airline {
      font-weight: 700;
      font-family: var(--font-mono, monospace);
      font-size: var(--text-base, 0.9375rem);
      color: var(--color-text, #f5f5f7);
    }
    .airline-flights {
      font-size: var(--text-sm, 0.8125rem);
      color: var(--color-text-secondary, #a1a1a6);
      margin-top: 2px;
    }
    .stats {
      display: flex;
      gap: var(--space-6, 1.5rem);
      align-items: center;
    }
    .stat-label {
      font-size: var(--text-xs, 0.6875rem);
      color: var(--color-text-muted, #6e6e73);
    }
    .stat-value {
      font-family: var(--font-mono, monospace);
      font-weight: 700;
      font-size: var(--text-sm, 0.8125rem);
      color: var(--color-text, #f5f5f7);
    }
    .empty {
      font-size: var(--text-sm, 0.8125rem);
      color: var(--color-text-muted, #6e6e73);
      text-align: center;
      padding: var(--space-8, 2rem) 0;
    }
  `];

  render() {
    if (this.profiles.length === 0) {
      return html`
        <div class="header">Airline Routing Profiles</div>
        <div class="empty">Run a route scan to see airline routing profiles.</div>
      `;
    }
    return html`
      <div class="header">Airline Routing Profiles</div>
      ${this.profiles.map(p => html`
        <div class="profile">
          <div>
            <div class="airline">${p.icao}</div>
            <div class="airline-flights">${p.flightCount} flights tracked</div>
          </div>
          <div class="stats">
            <div>
              <div class="stat-label">Min distance</div>
              <div class="stat-value">${p.minConflictDistance} km</div>
            </div>
            <div>
              <div class="stat-label">Avg distance</div>
              <div class="stat-value">${p.avgConflictDistance} km</div>
            </div>
            <risk-badge .level=${p.riskLevel}></risk-badge>
          </div>
        </div>
      `)}
    `;
  }
}
