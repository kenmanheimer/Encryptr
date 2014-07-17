(function (window, console, Encryptr, undefined) {
  "use strict";
  console       = console || {};
  console.log   = console.log || function() {};
  var Backbone  = window.Backbone,
    _           = window._,
    $           = window.Zepto;

  var EntriesCollection = Backbone.Collection.extend({
    initialize: function(models, options) {
      this.containerID = ((options && options.containerID) ||
                          window.app.rootContainerID);
      this.model = Encryptr.prototype.EntryModel; // default
    },
    fetch: function (options) {
      var _this = this;
      window.app.session.load(this.containerID, function(err, container) {
        if (options && options.error && err) { options.error(err); }
        if (err) return;
        _this.set(
          // @KLM: incorporate folder type, modulo latest master developments.
          _.map(container.keys, function(value, key) {
            var item;
            if (value.type === "Folder") {
              item = new Encryptr.prototype.FolderModel(value);
            }
            else {
              // Can't use _this.model() because FolderModel twiddles it.
              item = new Encryptr.prototype.EntryModel({
                id: key,
                label: value.label,
                type: value.type
              });
            }
            item.container = container;
            return item;
          })
        );
        if (options && options.success) options.success(_this);
      });
    },
    sync: function() {
      // @TODO: EntriesCollection.sync
    },
    // We must explicitly recurse to dispose of subfolders.
    destroy: function (options) {
      // Ensure we have our crypton container, in so far as it's available:
      this.fetch();
      // Iterate over the contents, to dispatch on any contained folders:
      this.forEach(function (entry) {
        if (entry.get("folderId")) {
          entry.destroy(options);
        }
      });
    },
    which: "EntriesCollection"
 });

  Encryptr.prototype.EntriesCollection = EntriesCollection;

})(this, this.console, this.Encryptr);
