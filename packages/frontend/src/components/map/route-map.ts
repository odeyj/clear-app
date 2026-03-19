import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { ScoredRoute, ConflictZone } from '@frcs/shared';
import leafletCss from 'leaflet/dist/leaflet.css?raw';
import L from 'leaflet';

@customElement('route-map')
export class RouteMap extends LitElement {
  @property({ type: Array }) routes: ScoredRoute[] = [];
  @property({ type: Object }) origin: { lat: number; lon: number; code: string } | null = null;
  @property({ type: Object }) destination: { lat: number; lon: number; code: string } | null = null;
  @property({ type: Number }) selectedRouteIndex = 0;

  @state() private map: L.Map | null = null;
  private routeLayers: L.LayerGroup = L.layerGroup();
  private markerLayer: L.LayerGroup = L.layerGroup();
  private zoneLayer: L.LayerGroup = L.layerGroup();

  // Opt out of Shadow DOM for Leaflet CSS compatibility
  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    // Guarantee dimensions via inline style (light DOM ignores static styles)
    this.style.display = 'block';
    this.style.height = '500px';
    this.style.borderRadius = '12px';
    this.style.overflow = 'hidden';
    this.style.background = '#2c2c2e';
    this.style.border = '1px solid rgba(255,255,255,0.08)';
    // Since we use light DOM, inject styles directly
    if (!document.getElementById('route-map-styles')) {
      const style = document.createElement('style');
      style.id = 'route-map-styles';
      style.textContent = `
        ${leafletCss}
        route-map {
          display: block;
          height: 500px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          overflow: hidden;
          background: #2c2c2e;
        }
        route-map .map-container { width: 100%; height: 100%; }
        /* Fix leaflet controls for dark theme */
        route-map .leaflet-control-zoom a {
          background: #2c2c2e;
          color: #f5f5f7;
          border-color: rgba(255,255,255,0.12);
        }
        route-map .leaflet-control-zoom a:hover {
          background: #3a3a3c;
        }
        route-map .leaflet-control-attribution {
          background: rgba(28,28,30,0.8);
          color: #6e6e73;
          font-size: 10px;
        }
        route-map .leaflet-control-attribution a {
          color: #a1a1a6;
        }
      `;
      document.head.appendChild(style);
    }
  }

  firstUpdated() {
    const container = this.querySelector('.map-container') as HTMLElement;
    if (!container) return;

    this.map = L.map(container, { zoomControl: true }).setView([30, 30], 3);

    // Dark-themed tile layer matching CLEAR UI
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 18,
    }).addTo(this.map);

    this.routeLayers.addTo(this.map);
    this.markerLayer.addTo(this.map);
    this.zoneLayer.addTo(this.map);

    // Layout may report 0x0 until after paint — retry sizing
    requestAnimationFrame(() => {
      this.map?.invalidateSize();
      this.updateMap();
    });
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 300);
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('routes') || changed.has('origin') || changed.has('destination') || changed.has('selectedRouteIndex')) {
      this.updateMap();
    }
  }

  private updateMap() {
    if (!this.map) return;

    this.routeLayers.clearLayers();
    this.markerLayer.clearLayers();
    this.zoneLayer.clearLayers();

    if (!this.origin || !this.destination) return;

    try {

    // Add origin/destination markers with dark-themed styling
    const originIcon = L.divIcon({ className: '', html: `<div style="background:#34c759;color:#fff;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;font-family:-apple-system,system-ui,sans-serif;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${this.origin.code}</div>` });
    const destIcon = L.divIcon({ className: '', html: `<div style="background:#34c759;color:#fff;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;font-family:-apple-system,system-ui,sans-serif;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${this.destination.code}</div>` });

    L.marker([this.origin.lat, this.origin.lon], { icon: originIcon }).addTo(this.markerLayer);
    L.marker([this.destination.lat, this.destination.lon], { icon: destIcon }).addTo(this.markerLayer);

    // Draw routes
    const riskColors: Record<string, string> = {
      low: '#34c759',
      moderate: '#ff9f0a',
      high: '#ff3b30',
      critical: '#ff2d55',
    };

    for (let i = 0; i < this.routes.length; i++) {
      const route = this.routes[i];
      if (!route.path?.coordinates?.length) continue;
      const coords = route.path.coordinates.map(c => [c[1], c[0]] as [number, number]);
      const isSelected = i === this.selectedRouteIndex;
      const color = riskColors[route.riskLevel] || '#6e6e73';

      L.polyline(coords, {
        color,
        weight: isSelected ? 3 : 1.5,
        opacity: isSelected ? 1 : 0.4,
        dashArray: isSelected ? undefined : '6 6',
      }).addTo(this.routeLayers);

      // Draw conflict zones for selected route
      if (isSelected) {
        for (const nz of route.nearbyZones) {
          L.circle([nz.zone.centroidLat, nz.zone.centroidLon], {
            radius: nz.zone.radiusKm * 1000,
            color: '#ff3b30',
            fillColor: '#ff3b30',
            fillOpacity: 0.15,
            weight: 1,
          }).addTo(this.zoneLayer);
        }
      }
    }

    // Fit bounds
    const allCoords: [number, number][] = [
      [this.origin.lat, this.origin.lon],
      [this.destination.lat, this.destination.lon],
    ];
    this.map.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40] });
    } catch (e) {
      console.error('route-map: updateMap failed', e);
    }
  }

  render() {
    return html`<div class="map-container" style="width:100%;height:100%"></div>`;
  }
}
