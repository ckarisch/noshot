// VUE mixin for all components
// usage: this.[methodname] (in any component)
var globalMixin = {
  created: function() {
  },
  data: () => {
    return {
      defaultDialogOptions: {
        html: true,
        // close on clicking outside
        backdropClose: true
      }
    }
  },
  methods: {
    notifyParents: (element, msg, object) => {
      let parent = element.$parent;
      while (parent) {
        parent.$emit(msg, object);
        parent = parent.$parent;
      }
    },
    confirmDialog: (element, html, onConfirm = undefined, onCancel = undefined, options = globalMixin.data().defaultDialogOptions) => {
      element.$dialog.confirm(html, options)
        .then(() => {
          if (onConfirm) onConfirm();
        })
        .catch(() => {
          if (onCancel) onCancel();
        });
    }
  } // methods
};
export default globalMixin;
