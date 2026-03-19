import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sharedStyles } from '../../styles/shared-styles.js';
import type { AlternativeRoute, ScoredRoute } from '@frcs/shared';
import '../common/risk-badge.js';

/**
 * Booking-style itinerary list (connecting flights) or fallback great-circle options.
 */
@customElement('safe-alternatives')
export class SafeAlternatives extends LitElement {
  @property({ type: Array }) alternatives: AlternativeRoute[] = [];
  /** Used when there are no hub itineraries — same map selection index as scored routes */
  @property({ type: Array }) fallbackRoutes: ScoredRoute[] = [];
  @property({ type: Number }) selectedIndex = 0;

  static styles = [sharedStyles, css`
    :host { display: block; }
    .header {
      font-size: var(--text-xs, 0.6875rem);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-text-muted, #6e6e73);
      font-weight: 600;
      margin-bottom: var(--space-4, 1rem);
    }
    .itinerary {
      background: var(--color-surface, #2c2c2e);
      border: 1px solid var(--color-border, rgba(255,255,255,0.08));
      border-radius: var(--radius-lg, 12px);
      padding: var(--space-5, 1.25rem) var(--space-6, 1.5rem);
      margin-bottom: var(--space-3, 0.75rem);
      cursor: pointer;
      transition: border-color var(--duration-fast, 0.15s) var(--ease-default);
    }
    .itinerary:hover {
      border-color: rgba(255,255,255,0.18);
    }
    .itinerary.selected {
      border-color: rgba(255,255,255,0.3);
      box-shadow: 0 0 0 1px rgba(255,255,255,0.3);
    }

    /* ── Route path row ── */
    .route-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4, 1rem);
    }
    .route-path {
      font-size: var(--text-base, 0.9375rem);
      font-weight: 700;
      color: var(--color-text, #f5f5f7);
      font-family: var(--font-mono, monospace);
      letter-spacing: 0.02em;
    }
    .route-path .via {
      color: var(--color-text-muted, #6e6e73);
      font-weight: 400;
      font-family: var(--font-sans);
      font-size: var(--text-sm, 0.8125rem);
    }

    /* ── Stats grid ── */
    .stats {
      display: flex;
      gap: var(--space-6, 1.5rem);
      margin-bottom: var(--space-4, 1rem);
      flex-wrap: wrap;
    }
    .stat {
      min-width: 80px;
    }
    .stat-label {
      font-size: var(--text-xs, 0.6875rem);
      color: var(--color-text-muted, #6e6e73);
      margin-bottom: 2px;
    }
    .stat-value {
      font-family: var(--font-mono, monospace);
      font-weight: 700;
      font-size: var(--text-sm, 0.8125rem);
      color: var(--color-text, #f5f5f7);
    }

    /* ── Reasoning ── */
    .reasoning {
      font-size: var(--text-sm, 0.8125rem);
      color: var(--color-text-secondary, #a1a1a6);
      line-height: 1.6;
    }

    .empty {
      text-align: center;
      padding: var(--space-8, 2rem) 0;
      color: var(--color-text-muted, #6e6e73);
      font-size: var(--text-sm, 0.8125rem);
    }
    .route-meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-4, 1rem);
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-secondary, #666);
      margin-bottom: var(--space-2, 0.5rem);
    }
    .score {
      font-family: var(--font-mono, monospace);
      font-weight: 700;
      font-size: var(--text-base, 1rem);
    }
  `];

  private emitSelect(index: number) {
    this.dispatchEvent(new CustomEvent('itinerary-select', {
      detail: { index },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    if (this.alternatives.length > 0) {
      return html`
        <div class="header">Itinerary options</div>
        ${this.alternatives.map((alt, i) => html`
          <div
            class="itinerary ${this.selectedIndex === i ? 'selected' : ''}"
            @click=${() => this.emitSelect(i)}
          >
            <div class="route-row">
              <div>
                <div class="route-path">${alt.description}</div>
              </div>
              <risk-badge .level=${alt.riskLevel} .score=${alt.score}></risk-badge>
            </div>
            <div class="stats">
              <div class="stat">
                <div class="stat-label">Total distance</div>
                <div class="stat-value">${alt.distanceKm.toLocaleString()} km</div>
              </div>
              <div class="stat">
                <div class="stat-label">Extra vs nonstop</div>
                <div class="stat-value">+${alt.extraDistanceKm.toLocaleString()} km</div>
              </div>
              <div class="stat">
                <div class="stat-label">Extra time (est.)</div>
                <div class="stat-value">+${alt.extraTimeMinutes} min</div>
              </div>
              <div class="stat">
                <div class="stat-label">Stops</div>
                <div class="stat-value">${alt.stops}</div>
              </div>
            </div>
            <div class="reasoning">${alt.reasoning}</div>
          </div>
        `)}
      `;
    }

    if (this.fallbackRoutes.length > 0) {
      return html`
        <div class="header">Great-circle path options</div>
        ${this.fallbackRoutes.map((route, i) => html`
          <div
            class="itinerary ${this.selectedIndex === i ? 'selected' : ''}"
            @click=${() => this.emitSelect(i)}
          >
            <div class="route-row">
              <div>
                <div class="route-path">${i + 1}. ${route.name}</div>
              </div>
              <div style="display:flex;align-items:center;gap:0.5rem">
                <span class="score risk-${route.riskLevel}">${route.score}</span>
                <risk-badge .level=${route.riskLevel}></risk-badge>
              </div>
            </div>
            <div class="route-meta">
              <span>${route.distanceKm.toLocaleString()} km</span>
              <span>${route.nearbyZones.length} conflict zone${route.nearbyZones.length !== 1 ? 's' : ''} nearby</span>
            </div>
            <div class="reasoning">${route.reasoning}</div>
          </div>
        `)}
      `;
    }

    return nothing;
  }
}
