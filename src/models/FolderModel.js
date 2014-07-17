// FolderModel.js
(function (window, console, Encryptr, undefined) {
  "use strict";
  console       = console || {};
  console.log   = console.log || function() {};
  var Backbone  = window.Backbone,
    _         = window._,
    $         = window.Zepto;

  /** FolderModel has features of an entry type, but is a real model. */
  var FolderModel = Backbone.Model.extend({
    defaults: {
      folderId: null,
      type: "Folder"
    },
    displayName: "Folder",
    collection: Encryptr.prototype.EntriesCollection,
    contents: null,
    initialize: function (model) {
      this.contents = null;
      this.type = "Folder";
    },
    /** Intervene in save to create our contents container, if we lack it. */
    save: function (attrs, options) {
      var thisFolder = this;
      if (! thisFolder.contents) {
        // @XXX Might should remove "folder:" to reduce server-exposed info?
        var folderId = "folderCollection:" + Backbone.guid(),
            collection = this.hookupCollection(folderId);
        thisFolder.set("folderId", folderId);
        var got = window.app.session.create(
          folderId,
          function (err, container) {
            Backbone.Model.prototype.save.call(thisFolder, attrs, options);
          });
      }
      else {
        Backbone.Model.prototype.save.call(thisFolder, attrs, options);
      }
    },
    fetch: function (options) {
      /* Reconstitute our entry collection if what we have is just the ID. */
      if (! this.contents) {
        var collection = this.hookupCollection(this.get("folderId"));
        collection.fetch({
          error: function(errmsg) {
            window.app.dialogAlertView.show({
              title: "Server fetch error",
              subtitle: errmsg
            }, function(){});
          }
        });
      }
    },
    hookupCollection: function(folderID) {
      var collection = new Encryptr.prototype.EntriesCollection(null, {
        containerID: folderID
      });
      collection.model = FolderModel;
      collection.theFolder = this;
      this.contents = collection;
      return collection;
    },
    destroy: function (options) {
      // TODO: TEST THIS!  RECURSIVE: ensure crypton containers are deleted!!
      // Ensure we have our collection, in so far as it's available:
      this.fetch();
      if (this.contents) {
        this.contents.destroy();
      }
      Backbone.Model.prototype.destroy.call(this, options);
    },
    which: "FolderModel"
  });

  Encryptr.prototype.FolderModel = FolderModel;

  Encryptr.prototype.types = Encryptr.prototype.types || {};
  Encryptr.prototype.types.FolderModel = FolderModel;

})(this, this.console, this.Encryptr);
