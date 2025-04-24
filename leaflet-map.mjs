(function injectLeafletCSS() {
  const id = 'leaflet-css';
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
})();

(function waitForFormioAndRegister() {
  if (!window.Formio || !Formio.Components || !Formio.Components.components) {
    return setTimeout(waitForFormioAndRegister, 50);
  }

  Formio.Components.addComponent('leafletmap', class extends Formio.Components.components.field {
    static schema(...extend) {
      return Formio.Components.components.field.schema({
        label: 'Leaflet Map',
        type: 'leafletmap',
        key: 'leafletmap',
        input: true
      }, ...extend);
    }

    static get builderInfo() {
      return {
        title: 'Leaflet Map',
        icon: 'map',
        group: 'advanced',
        weight: 50,
        schema: this.schema()
      };
    }

    render() {
      console.log('[LeafletMap] render() called');
      return '<div style="padding: 1rem; background: yellow;">Hello from LeafletMap</div>';
    }

    attach(element) {
      console.log('[LeafletMap] attach() called');
      super.attach(element);

      const waitForLeaflet = () => {
        if (!window.L || !this.refs.mapContainer) {
          return setTimeout(waitForLeaflet, 50);
        }

        console.log('[LeafletMap] Leaflet detected:', typeof L);
        console.log('[LeafletMap] Container ref:', this.refs.mapContainer);

        const lat = 41.8781;
        const lng = -87.6298;
        const radius = 800;

        const map = L.map(this.refs.mapContainer).setView([lat, lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        L.circle([lat, lng], {
          color: 'blue',
          fillColor: '#3f7df3',
          fillOpacity: 0.4,
          radius: radius
        }).addTo(map);

        L.marker([lat, lng]).addTo(map);

        // Force proper map size layout
        setTimeout(() => {
          map.invalidateSize();
          console.log('[LeafletMap] invalidateSize() called');
        }, 0);
      };

      waitForLeaflet();

      return element;
    }
  });

  console.log('[LeafletMap] Component registered.');
})();
