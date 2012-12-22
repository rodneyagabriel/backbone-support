
//*@public
/**
    _enyo.CollectionRowMixin_ is an _enyo.Mixin_ kind used by
    _enyo.CollectionList_ and _enyo.CollectionRepeater_ that enables
    auto-bindings on child views that have a _bindProperty_ and
    _bindTarget_ properties.
    
    Note that this mixin is responsible for applying the
    _enyo.CollectionRowControllerMixin_ to the row's controller.
*/
enyo.Mixin({
    //*@protected
    name: "enyo.CollectionRowMixin",
    // if we don't have a controller we create the generic model controller
    // for the view otherwise we initialize the auto bindings since setting
    // the controller will cause the controllerChanged observer to fire and
    // that automatically fires the initAutoBindings method
    initMixin: function () {
        if (!this.controller) {
            this.set("controller", "enyo.ModelController");
        }
        this.controllerChanged();
    },
    // clean up all the auto bindings when the view is destroyed
    destroyMixin: function () {
        this.clearAutoBindings();
        this.inherited(arguments);
    },
    // here we create what would otherwise be normal bindings but
    // give them a special property so we can select them via the
    // computed property (a filter on the _bindings property of the
    // view), but the bindings we create are using the controller of
    // the view as the source, the view as the target, the
    // bindProperty as the property on the controller to retrieve
    // (from) and the bindTarget (or content in its absence) (to)
    initAutoBindings: function () {
        var controller = this.controller;
        var controls = this.get("bindableControls");
        if (!controller) return;
        enyo.forEach(controls, function (child) {
            var prop = child.bindProperty;
            var to = this.getBindTargetFor(child);
            this.autoBinding({
                source: controller,
                from: prop,
                target: child,
                to: to
            });
        }, this);
        this.autoBinding({
            source: controller,
            from: "selected",
            target: this,
            to: "selected"
        });
    },
    // when the model's selected property changes we attempt
    // to update accordingly - the default is to place a
    // "selected" class on the row and if the developer
    // wishes they can supply the appropriate CSS to display
    // the row differently
    selectedChanged: function () {
        this.addRemoveClass("selected", this.selected);
        this.inherited(arguments);
    },
    // figure out if a bindTarget was put on the child and
    // if not get set it to content, if it was set make sure
    // it has the correct format
    getBindTargetFor: function (child) {
        var to = child.get("bindTarget");
        if (!to) to = ".content";
        to = to[0] === "."? to: "." + to;
        return to;
    },
    // this is the function that essentially wraps the default
    // binding method on object, add the isAutoBinding boolean
    autoBinding: function () {
        var binding = this.binding.apply(this, arguments);
        binding.isAutoBinding = true;
        return binding;
    },
    // computed property that will return the array of auto bindings
    // for this view
    autoBindings: enyo.Computed(function () {
        return enyo.filter(this._bindings, function (binding) {
            return binding.isAutoBinding === true;
        });
    }),
    // auto fire this changed event when the controller is updated
    controllerChanged: function () {
        this.inherited(arguments);
        if (this.controller) {
            this.controller.extend(enyo.CollectionRowControllerMixin);
            // we need to recreate the responders so they will reference
            // the newly overloaded methods
            this.controller.createResponders();
            this.clearAutoBindings();
            this.initAutoBindings();
        }
    },
    // make sure to remove all of the auto bindings, this needed
    // to be separate from the normal clearBindings of the view
    // because this can happen even when the view is still active
    clearAutoBindings: function () {
        var autos = this.get("autoBindings");
        var binding;
        while(autos.length) {
            binding = autos.shift();
            binding.destroy();
        }
    },
    // computed property for bindable controls in an array
    bindableControls: enyo.Computed(function () {
        var controls = enyo.clone(this.controls);
        controls.unshift(this);
        return this.findBindableControls(controls);
    }),
    // figure out what the bindable controls are including this
    // view and all of its children
    // recursive decent search for bindable controls
    findBindableControls: function (controls) {
        var ret = [];
        var fn;
        if (!controls || controls.length === 0) return controls;
        fn = enyo.bind(this, this.findBindableControls);
        enyo.forEach(controls, function (control) {
            ret = ret.concat(fn(control.controls || []));
            if (control.bindProperty) ret.push(control);  
        });
        return ret;
    }
})