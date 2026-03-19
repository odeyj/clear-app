import { css } from 'lit';

export const sharedStyles = css`
  :host {
    font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif);
    color: var(--color-text, #f5f5f7);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .card {
    background: var(--color-surface, #2c2c2e);
    border: 1px solid var(--color-border, rgba(255,255,255,0.08));
    border-radius: var(--radius-lg, 12px);
    padding: var(--space-5, 1.25rem);
  }

  .label {
    font-size: var(--text-xs, 0.6875rem);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted, #6e6e73);
    font-weight: 600;
  }

  .score {
    font-family: var(--font-mono, monospace);
    font-weight: 700;
  }

  .risk-low { color: var(--color-risk-low, #34c759); }
  .risk-moderate { color: var(--color-risk-moderate, #ff9f0a); }
  .risk-high { color: var(--color-risk-high, #ff3b30); }
  .risk-critical { color: var(--color-risk-critical, #ff2d55); }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2, 0.5rem);
    padding: var(--space-3, 0.75rem) var(--space-6, 1.5rem);
    border: 1px solid var(--color-border-strong, rgba(255,255,255,0.14));
    border-radius: var(--radius-lg, 12px);
    background: transparent;
    color: var(--color-text, #f5f5f7);
    font-size: var(--text-base, 0.9375rem);
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: all var(--duration-fast, 0.15s) var(--ease-default);
    -webkit-font-smoothing: antialiased;
  }
  .btn:hover {
    background: var(--color-surface-elevated, #3a3a3c);
    border-color: rgba(255,255,255,0.22);
  }
  .btn:active {
    transform: scale(0.97);
  }
  .btn-primary {
    background: var(--color-text, #f5f5f7);
    color: var(--color-bg, #1c1c1e);
    border-color: transparent;
    font-weight: 600;
  }
  .btn-primary:hover {
    background: #e8e8ed;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
`;
