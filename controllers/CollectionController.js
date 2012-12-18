
//*@public
/**
    _enyo.CollectionController_ is a subkind of _enyo.ArrayController_
    and is designed to proxy an underlying _enyo.Collection_ kind. It
    properly handles events and allows for the collection to be changed
    without modifying active bindings against the controller. In essence
    having an _enyo.CollectionController_ allows multiple controllers/views
    to use the underlying collection.
    
    It is not uncommon for this controller kind to be used instead of an
    actual _enyo.Collection_ for other controllers. Any _enyo.CollectionController_
    that has an underlying _enyo.Collection_ can be used by other
    _enyo.CollectionController_s. This is intended.
*/
enyo.kind({
    name: "enyo.CollectionController",
    kind: "enyo.ArrayController",
    published: {
        // a string or function for the desired collection
        collection: null,
        // auto-fire the load/fetch method of the underlying
        // collection kind
        autoLoad: false,
        // the current status of the underlying collection
        // see _enyo.Collection.status_
        status: enyo.Collection.OK,
        // the current length of the collection
        length: 0,
        // the same reference to the array of models in the collection
        // but is typically used by other controllers when proxying
        // the data of this controller
        models: null
    },
    //*@protected
    mixins: ["enyo.SelectionSupportMixin"],
    //*@protected
    handlers: {
        // these are automatic handlers for these events that are
        // bubbled by the underlying collection, an owner of this
        // controller or any dispatch targets will also receive these
        // events
        oncollectionchange: "modelChanged",
        oncollectionadd: "modelAdded",
        oncollectionremove: "modelRemoved",
        oncollectiondestroy: "modelDestroyed",
        oncollectionreset: "modelsReset"
    },
    create: function () {
        this.inherited(arguments);
        this.collectionChanged();
        if (this.get("autoLoad") === true) enyo.run(this.load, this);
    },
    // setup our bindings for the collection if we have it
    // note that these will still be applied whenever the collection
    // is available
    bindings: [
        {from: "collection.length", to: "length"},
        {from: "collection.status", to: "status"},
        // this is so that this kind can be used as a collection for
        // other collection controllers
        {from: "collection.models", to: "models"}
    ],
    //*@public
    /**
        Override this computed property to return any filtered
        content.
    */
    data: enyo.Computed(function () {
        return this.get("models");
    }, "models"),
    /**
        This method is designed to allow for several scenarios. If
        the kind definition supplied a collection constructor or
        string path to a constructor we can use it, if it was an
        instance of a collection or string path to an instance we can
        use it. If it does not exist the controller first attempts to
        see if it has an owner and if the owner has the definition
        instead. If the owner does not have a definition for the collection
        it will wait until either of the following occurs: the owner
        changes and it will be reevaluated to see if the collection is
        defined on the owner or the collection is arbitrarily set
        at a later time.
    */
    collectionChanged: function () {
        this.findAndInstance("collection", function (ctor, inst) {
            if (!(ctor || inst)) {
                // we could not find the required collection so check
                // to see if we have an owner and if so check to see
                // if it has the collection definition
                if (this.owner) {
                    if (this.owner.collection) {
                        this.collection = this.owner.collection;
                        return this.collectionChanged();
                    } else return;
                } else if (this.model) {
                    inst = this.collection = new enyo.Collection();
                    inst.set("model", this.model);
                } else return;
            }
            // if we have the constructor we know we're the owner of
            // this collection and we need to notify it of that
            if (ctor) inst.set("owner", this);
            // else we aren't the owner but we need to register for
            // events just the same
            else inst.addDispatchTarget(this);
            // go ahead and refresh any bindings
            // but make sure not to emit the changes until all properties
            // have actually been updated
            this.stopNotifications();
            this.refreshBindings();
            // this is the simple case
            if (this.owner) this.startNotifications();
            else {
                // otherwise we needed to be able to get all of the bindings refreshed
                // from the perspective of the dispatch target such that emitting a changed
                // event that assumes other things, such as, say if the length changed
                // was emitted prior to the data/models bindings refreshing - would cause
                // all sorts of issues
                enyo.forEach(this.dispatchTargets, function (target) {
                    target.stopNotifications();
                    // it turns out that controllers that are proxying the content of this
                    // controller, using it as a collection, are more efficient if they also
                    // receive the event rather than wait exclusively for dataChanged etc
                    if (target.collection && this === target.collection) target.collectionChanged();
                    else target.refreshBindings();
                    target.startNotifications();
                }, this);
                // make sure to start these back up
                this.startNotifications();
            }
        });
    },
    //*@public
    /**
        See _enyo.Collection.fetch_
    */
    load: function (options) {
        var col = this.collection;
        if (!col) return false;
        else return col.fetch.apply(col, arguments);
    },
    /**
        See _enyo.Collection.fetch_
    */
    fetch: function (options) {
        var col = this.collection;
        if (!col) return false;
        else return col.fetch.apply(col, arguments);
    },
    /**
        See _enyo.Collection.reset_
    */
    reset: function (models, options) {
        var col = this.collection;
        if (!col) return false;
        else return col.reset.apply(col, arguments);
    },
    /**
        See _enyo.Collection.add_
    */
    add: function (model, options) {
        var col = this.collection;
        if (!col) return false;
        else return col.add.apply(col, arguments);
    },
    /**
        See _enyo.Collection.remove_
    */
    remove: function (model, options) {
        var col = this.collection;
        if (!col) return false;
        else return col.remove.apply(col, arguments);
    },
    /**
        See _enyo.Collection.at_
    */
    at: function (idx) {
        var col = this.collection;
        if (!col) return false;
        else return col.at.apply(col, arguments);
    },
    /**
        See _enyo.Collection.indexOf_
    */
    indexOf: function (model) {
        var col = this.collection;
        if (!col) return false;
        else return col.indexOf.apply(col, arguments);
    },
    //*@protected
    /**
        If the owner is changed we need to update accordingly.
    */
    ownerChanged: function () {
        if ("object" !== typeof this.collection) this.collectionChanged();
        if (this.collection && !this.collection.model && this.model) {
            this.collection.set("model", this.model);
        }
        return this.inherited(arguments);
    }
})