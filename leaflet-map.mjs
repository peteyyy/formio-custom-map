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
        input: false // no data for now
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
      return super.render(`
        <div style="height:300px; border:1px solid #ccc;" ref="mapContainer"></div>
      `);
    }

    attach(element) {
      super.attach(element);

      const waitForLeaflet = () => {
        if (!window.L || !this.refs.mapContainer) {
          return setTimeout(waitForLeaflet, 50);
        }

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
      };

      waitForLeaflet();

      return element;
    }
  });

  console.log('[LeafletMap] Hardcoded map initialized.');
})();
