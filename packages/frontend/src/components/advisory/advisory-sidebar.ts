import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sharedStyles } from '../../styles/shared-styles.js';
import type { Advisory } from '@frcs/shared';

@customElement('advisory-sidebar')
export class AdvisorySidebar extends LitElement {
  @property({ type: Array }) advisories: Advisory[] = [];
  @property({ type: Boolean }) loading = false;

  static styles = [sharedStyles, css`
    :host { display: block; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-5, 1.25rem);
    }
    .title {
      font-size: var(--text-xl, 1.25rem);
      font-weight: 700;
      color: var(--color-text, #f5f5f7);
    }
    .live-indicator {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
      font-size: var(--text-xs, 0.6875rem);
      color: var(--color-text-muted, #6e6e73);
    }
    .live-dot {
      width: 6px;
      height: 6px;
      background: var(--color-risk-low, #34c759);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    .advisory {
      display: flex;
      gap: var(--space-4, 1rem);
      padding: var(--space-5, 1.25rem) 0;
      border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.08));
    }
    .advisory:last-child { border-bottom: none; }
    .advisory-icon {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full, 9999px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-sm, 0.8125rem);
    }
    .icon-notam {
      background: rgba(255, 59, 48, 0.15);
      color: var(--color-risk-high, #ff3b30);
    }
    .icon-conflict {
      background: rgba(255, 59, 48, 0.15);
      color: var(--color-risk-high, #ff3b30);
    }
    .icon-anomaly {
      background: rgba(255, 159, 10, 0.15);
      color: var(--color-risk-moderate, #ff9f0a);
    }
    .icon-closure {
      background: rgba(175, 82, 222, 0.15);
      color: var(--color-closure, #af52de);
    }
    .advisory-content {
      flex: 1;
      min-width: 0;
    }
    .advisory-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-2, 0.5rem);
      margin-bottom: var(--space-1, 0.25rem);
    }
    .advisory-title {
      font-weight: 600;
      font-size: var(--text-sm, 0.8125rem);
      color: var(--color-text, #f5f5f7);
    }
    .advisory-time {
      font-size: var(--text-xs, 0.6875rem);
      color: var(--color-text-muted, #6e6e73);
      white-space: nowrap;
    }
    .advisory-desc {
      font-size: var(--text-sm, 0.8125rem);
      color: var(--color-text-secondary, #a1a1a6);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: var(--space-3, 0.75rem);
    }
    .advisory-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2, 0.5rem);
    }
    .advisory-tag {
      font-size: var(--text-xs, 0.6875rem);
      font-weight: 600;
      padding: 2px 8px;
      border-radius: var(--radius-full, 9999px);
      border: 1px solid;
    }
    .tag-severity-high {
      color: var(--color-risk-high, #ff3b30);
      border-color: var(--color-risk-high, #ff3b30);
      background: rgba(255, 59, 48, 0.1);
    }
    .tag-severity-moderate {
      color: var(--color-risk-moderate, #ff9f0a);
      border-color: var(--color-risk-moderate, #ff9f0a);
      background: rgba(255, 159, 10, 0.1);
    }
    .tag-severity-low {
      color: var(--color-risk-low, #34c759);
      border-color: var(--color-risk-low, #34c759);
      background: rgba(52, 199, 89, 0.1);
    }
    .tag-neutral {
      color: var(--color-text-secondary, #a1a1a6);
      border-color: var(--color-border-strong, rgba(255,255,255,0.14));
      background: transparent;
    }
    .empty {
      font-size: var(--text-sm, 0.8125rem);
      color: var(--color-text-muted, #6e6e73);
      text-align: center;
      padding: var(--space-8, 2rem) 0;
    }
  `];

  private getIcon(type: string): string {
    switch (type) {
      case 'notam': return '\u24D8';
      case 'conflict': return '\u24D8';
      case 'anomaly': return '\u2192';
      case 'closure': return '\u24D8';
      default: return '\u24D8';
    }
  }

  private getSeverityTag(type: string): string {
    switch (type) {
      case 'notam': return 'high';
      case 'conflict': return 'high';
      case 'anomaly': return 'moderate';
      case 'closure': return 'high';
      default: return 'low';
    }
  }

  private getTypeLabel(type: string): string {
    switch (type) {
      case 'notam': return 'Long-term closure';
      case 'conflict': return 'High impact';
      case 'anomaly': return 'Airline bulletin';
      case 'closure': return 'Watch status';
      default: return type;
    }
  }

  render() {
    return html`
      <div class="header">
        <span class="title">Live advisories</span>
        <div class="live-indicator">
          <div class="live-dot"></div>
          Updated just now
        </div>
      </div>
      ${this.loading ? html`<loading-spinner>Fetching advisories...</loading-spinner>` : nothing}
      ${!this.loading && this.advisories.length === 0
        ? html`<div class="empty">No active advisories</div>`
        : nothing}
      ${this.advisories.map(a => html`
        <div class="advisory">
          <div class="advisory-icon icon-${a.type}">${this.getIcon(a.type)}</div>
          <div class="advisory-content">
            <div class="advisory-top">
              <span class="advisory-title">${a.title}</span>
              <span class="advisory-time">${this.formatDate(a.issuedAt)}</span>
            </div>
            <div class="advisory-desc">${a.description}</div>
            <div class="advisory-tags">
              <span class="advisory-tag tag-severity-${this.getSeverityTag(a.type)}">${this.getTypeLabel(a.type)}</span>
              <span class="advisory-tag tag-neutral">${a.source}</span>
            </div>
          </div>
        </div>
      `)}
    `;
  }

  private formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return `${Math.max(1, Math.floor(diffMs / (1000 * 60)))} min ago`;
      if (diffHours < 24) return `${diffHours} hr ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return iso; }
  }
}
