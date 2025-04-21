import { Components } from 'formiojs';
const FieldComponent = (Components).components.field;

export default class MyCustomComponent extends FieldComponent {
  static schema() {
    return FieldComponent.schema({
      type: 'mycustomcomponent',
      label: 'My Custom Component',
      key: 'myCustomComponent'
    });
  }

  static editForm() {
    return FieldComponent.editForm();
  }

  render() {
    return super.render(`<div>Hello, Custom Component!</div>`);
  }
}

Components.addComponent('mycustomcomponent', MyCustomComponent);