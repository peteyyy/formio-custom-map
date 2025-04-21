window.Formio = window.Formio || {};
Formio.Components = Formio.Components || {};

Formio.Components.addComponent('leafletmap', class extends Formio.Components.components.textfield {
  static schema(...extend) {
    return Formio.Components.components.textfield.schema({
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
    return super.render(`<div style="height:300px;border:1px solid #ccc;">Map will be here</div>`);
  }

  attach(element) {
    super.attach(element);
    return element;
  }
});
