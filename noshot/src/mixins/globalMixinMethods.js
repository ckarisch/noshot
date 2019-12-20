// VUE mixins for all components
// usage: this.[methodname] (in any component)
var globalMixinMethods = {
  notifyParents: (element, msg, object) => {
    let parent = element.$parent;
    while (parent) {
      parent.$emit(msg, object);
      parent = parent.$parent;
    }
  }
};
export default globalMixinMethods;
