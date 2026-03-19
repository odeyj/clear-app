import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sharedStyles } from '../../styles/shared-styles.js';
import type { ScoredRoute } from '@frcs/shared';
import '../common/risk-badge.js';

@customElement('scan-results')
export class ScanResults extends LitElement {
  @property({ type: Array }) routes: ScoredRoute[] = [];

  static styles = [sharedStyles, css`
    :host { display: block; }
    .header {
      margin-bottom: var(--space-1, 0.25rem);
    }
    .header-title {
      font-size: var(--text-lg, 1.0625rem);
      font-weight: 700;
      color: var(--color-text, #f5f5f7);
    }
    .header-sub {
      font-size: var(--text-sm, 0.8125rem);
      color: var(--color-text-secondary, #a1a1a6);
      margin-top: 2px;
      margin-bottom: var(--space-4, 1rem);
    }
    .route {
      padding: var(--space-5, 1.25rem);
      background: var(--color-surface, #2c2c2e);
      border: 1px solid var(--color-border, rgba(255,255,255,0.08));
      border-radius: var(--radius-lg, 12px);
      margin-bottom: var(--space-3, 0.75rem);
      cursor: pointer;
      transition: border-color var(--duration-fast, 0.15s) var(--ease-default);
    }
    .route:hover {
      border-color: rgba(255,255,255,0.18);
    }
    .route-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-2, 0.5rem);
    }
    .route-name {
      font-weight: 700;
      font-size: var(--text-base, 0.9375rem);
      color: var(--color-text, #f5f5f7);
    }
    .route-via {
      font-size: var(--text-sm, 0.8125rem);
      color: var(--color-text-secondary, #a1a1a6);
      margin-top: 2px;
    }
    .score-block {
      text-align: right;
    }
    .score-value {
      font-family: var(--font-mono, monospace);
      font-weight: 800;
      font-size: var(--text-2xl, 1.5rem);
      line-height: 1;
    }
    .score-label {
      font-size: var(--text-xs, 0.6875rem);
      color: var(--color-text-muted, #6e6e73);
      margin-top: 2px;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2, 0.5rem);
      margin: var(--space-3, 0.75rem) 0;
      align-items: center;
    }
    .tag {
      font-size: var(--text-xs, 0.6875rem);
      font-weight: 600;
      padding: 3px 10px;
      border-radius: var(--radius-full, 9999px);
      border: 1px solid;
    }
    .tag-low {
      color: var(--color-risk-low, #34c759);
      border-color: var(--color-risk-low, #34c759);
    }
    .tag-moderate {
      color: var(--color-risk-moderate, #ff9f0a);
      border-color: var(--color-risk-moderate, #ff9f0a);
    }
    .tag-high {
      color: var(--color-risk-high, #ff3b30);
      border-color: var(--color-risk-high, #ff3b30);
    }
    .tag-critical {
      color: var(--color-risk-critical, #ff2d55);
      border-color: var(--color-risk-critical, #ff2d55);
    }
    .tag-neutral {
      color: var(--color-text-secondary, #a1a1a6);
      border-color: var(--color-border-strong, rgba(255,255,255,0.14));
    }
    .route-meta {
      font-size: var(--text-sm, 0.8125rem);
      color: var(--color-text-secondary, #a1a1a6);
    }
    .reasoning {
      font-size: var(--text-sm, 0.8125rem);
      color: var(--color-text-secondary, #a1a1a6);
      line-height: 1.5;
      margin-top: var(--space-3, 0.75rem);
    }
  `];

  private handleSelect(route: ScoredRoute) {
    this.dispatchEvent(new CustomEvent('route-select', {
      detail: route,
      bubbles: true,
      composed: true,
    }));
  }

  private getRecommendationTag(route: ScoredRoute, index: number) {
    if (index === 0 && route.riskLevel === 'low') return html`<span class="tag tag-low">Recommended</span>`;
    if (route.riskLevel === 'low') return html`<span class="tag tag-low">Generally safe</span>`;
    if (route.riskLevel === 'moderate') return html`<span class="tag tag-moderate">Use caution</span>`;
    if (route.riskLevel === 'high') return html`<span class="tag tag-high">Not recommended</span>`;
    if (route.riskLevel === 'critical') return html`<span class="tag tag-critical">Avoid</span>`;
    return nothing;
  }

  render() {
    if (this.routes.length === 0) return nothing;
    return html`
      <div class="header">
        <div class="header-title">Route analysis</div>
        <div class="header-sub">Ranked by conflict proximity score</div>
      </div>
      ${this.routes.map((route, i) => html`
        <div class="route" @click=${() => this.handleSelect(route)}>
          <div class="route-header">
            <div>
              <div class="route-name">${route.name}</div>
              <div class="route-via">${route.distanceKm.toLocaleString()} km</div>
            </div>
            <div class="score-block">
              <div class="score-value risk-${route.riskLevel}">${route.score}</div>
              <div class="score-label">Safety score</div>
            </div>
          </div>
          <div class="tags">
            ${this.getRecommendationTag(route, i)}
            ${route.nearbyZones.length === 0
              ? html`<span class="tag tag-low">No conflict zones</span>`
              : html`<span class="tag tag-${route.riskLevel}">${route.nearbyZones.length} zone${route.nearbyZones.length !== 1 ? 's' : ''} nearby</span>`}
            <span class="route-meta">${route.distanceKm > 0 ? `+${Math.round(route.distanceKm * 0.1)}hr vs direct` : ''}</span>
          </div>
          <div class="reasoning">${route.reasoning}</div>
        </div>
      `)}
    `;
  }
}
