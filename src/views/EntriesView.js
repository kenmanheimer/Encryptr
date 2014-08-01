(function (window, console, Encryptr, undefined) {
  "use strict";
  console       = console || {};
  console.log   = console.log || function() {};
  var Backbone  = window.Backbone,
  _         = window._,
  $         = window.Zepto;

  var EntriesView = Backbone.View.extend({
    destructionPolicy: "never",
    events: {
      // ...
    },
    initialize: function() {
      _.bindAll(this, "render", "addAll", "addOne", "viewActivate",
        "viewDeactivate");
      this.collection.bind("reset", this.addAll, this);
      this.collection.bind("add", this.addOne, this);
      this.collection.bind("remove", this.addAll, this);
      this.on("viewActivate",this.viewActivate);
      this.on("viewDeactivate",this.viewDeactivate);

      this.subViews = [];
      this.hasItems = false;
    },
    render: function() {
      this.$el.html(window.tmpl["entriesView"]({}));
      window.app.mainView.on("deleteentry",
                             this.deleteButton_clickHandler,
                             this);
      window.app.mainView.once("editentry",
                               this.editButton_clickHandler,
                               this);
      return this;
    },
    addAll: function () {
      this.$(".entriesViewLoading").removeClass("loadingEntries");
      if (this.collection.models.length === 0) {
        window.setTimeout(function() {
          $(".emptyEntries").show();
        }, 300);
      } else {
        $(".emptyEntries").hide();
      }
      this.$(".entries").html("");
      this.collection.each(this.addOne);
    },
    addOne: function(model) {
      $(".emptyEntries").hide();
      this.$(".entriesViewLoading").removeClass("loadingEntries");
      if (this.collection.models.length === 0) {
        window.setTimeout(function() {
          $(".emptyEntries").show();
        }, 300);
      } else {
        $(".emptyEntries").hide();
      }
      var view = new Encryptr.prototype.EntriesListItemView({
        model: model
      });
      this.$(".entries").append(view.render().el);
      this.subViews.push(view);
    },
    viewActivate: function(event) {
      var _this = this,
          rootContainerID = window.app.rootContainerID;
      this.collection.fetch({
        container: rootContainerID,
        success: function(entries) {
          if (entries.length === 0) {
            _this.addAll();
          }
        }, error: function(err) {
          window.app.session.create(rootContainerID, function(err, container) {
            if (err) {
              // OK. This is a bit more serious...
              console.log(err);
              window.app.dialogAlertView.show({
                title: "Critical Error",
                subtitle: err
              }, function() {
                console.log("could not even recreate the container...");
              });
              return;
            }
            // the container should exist now...
            _this.viewActivate(event);
          });
        }
      });

      window.app.mainView.on("deleteentry",
                             _this.deleteButton_clickHandler,
                             _this);
      window.app.mainView.on("editentry",
                             _this.editButton_clickHandler,
                             _this);

      if (_this.collection.theFolder) {
        $(".nav .back-btn").removeClass("hidden");
        $(".nav .edit-btn.right").removeClass("hidden");
        $(".nav .delete-btn").removeClass("hidden");
        window.app.mainView.setTitle(_this.collection.theFolder.get("label"));
      }
      $(".nav .menu-btn").removeClass("hidden");

    },
    viewDeactivate: function(event) {
      if (this.collection.theFolder) {
        $(".nav .back-btn").addClass("hidden");
        $(".nav .btn.right").addClass("hidden");
        $(".nav .delete-btn").addClass("hidden");
      }
      window.app.mainView.setTitle("Encryptr");
      $(".nav .menu-btn").removeClass("hidden");
      $(".nav .add-btn.right").removeClass("hidden");
      window.app.mainView.off("editentry", null, null);
      window.app.mainView.off("deleteentry", null, null);
    },
    editButton_clickHandler: function(event) {
      window.app.navigator.pushView(
        window.app.EditView,
        {model: this.collection.theFolder},
        window.app.noEffect
      );
    },
    deleteButton_clickHandler: function(event) {
      var _this = this;
      window.app.dialogConfirmView.show({
        title: "Confirm delete",
        subtitle: "Delete this folder and contents?"
      }, function(event) {
        console.log(event);
        if (event.type === "dialogAccept") {
          _this.collection.theFolder.destroy();
          window.app.navigator.popView(window.app.defaultPopEffect);
        }
      });
    },
    close: function() {
      _.each(this.subViews, function(view) {
        view.close();
      });
      this.remove();
    },
    which: "EntriesView"
  });
  Encryptr.prototype.EntriesView = EntriesView;

  var EntriesListItemView = Backbone.View.extend({
    tagName: "li",
    className: "entry",
    events: {
      "click a": "a_clickHandler"
    },
    initialize: function() {
      _.bindAll(this, "render");
      this.model.bind("change", this.render, this);
    },
    render: function() {
      this.$el.html(
        window.tmpl["entriesListItemView"](
          this.model.toJSON()
        )
      );
      return this;
    },
    a_clickHandler: function(event) {
      var _this = this,
          folderId = _this.model.get("folderId");
      if (!$(".menu").hasClass("dismissed") ||
            !$(".addMenu").hasClass("dismissed")) {
        return;
      }
      if (folderId) {
        _this.model.fetch();
        window.app.navigator.pushView(
          window.app.EntriesView,
          {collection: _this.model.contents},
          window.app.noEffect
        );
      }
      else {
        window.app.navigator.pushView(window.app.EntryView, {
          model: _this.model
        }, window.app.defaultEffect);
      }
    },
    close: function() {
      this.remove();
    },
    which: "EntriesListItemView"
  });
  Encryptr.prototype.EntriesListItemView = EntriesListItemView;

})(this, this.console, this.Encryptr);
