var Manager,
    ASSETS_NS = 'http://www.wso2.org/governance/metadata';

(function () {

    var search = function (that, options) {
        if (options.query) {
            var query = options.query.toLowerCase();
            return that.manager.find(function (asset) {
                var name,
                    attributes = asset.attributes;
                for (name in attributes) {
                    if (attributes.hasOwnProperty(name)) {
                        if (attributes[name].toLowerCase().indexOf(query) !== -1) {
                            return true;
                        }
                    }
                }
                return false;
            });
        }
        if (options.tag) {
            var registry = that.registry,
                tag = options.tag;
            return that.manager.find(function (artifact) {
                return registry.tags(artifact.path).indexOf(tag) != -1;
            });
        }
        return [];
    };

    Manager = function (registry, type) {
        var carbon = require('carbon');
        this.registry = registry;
        this.type = type;
        this.user = require('/modules/user.js');
        Packages.org.wso2.carbon.governance.api.util.GovernanceUtils.loadGovernanceArtifacts(registry.registry);
        this.manager = new carbon.registry.ArtifactManager(registry, type);
        this.sorter = new Sorter(registry);
    };

    var Sorter = function (registry) {
        this.registry = registry;
    };

    Sorter.prototype.recent = function (items) {
        var registry = this.registry;
        items.sort(function (l, r) {
            return registry.get(l.path).created.time < registry.get(r.path).created.time;
        });
        return items;
    };

    Sorter.prototype.popular = function (items) {
        var registry = this.registry;
        items.sort(function (l, r) {
            return registry.rating(l.path).average > registry.rating(r.path).average;
        });
        return items;
    };

    Sorter.prototype.unpopular = function (items) {
        var registry = this.registry;
        items.sort(function (l, r) {
            return registry.rating(l.path).average < registry.rating(r.path).average;
        });
        return items;
    };

    Sorter.prototype.older = function (items) {
        var registry = this.registry;
        items.sort(function (l, r) {
            return registry.get(l.path).created.time > registry.get(r.path).created.time;
        });
        return items;
    };

    Sorter.prototype.paginate = function (items, paging) {
        switch (paging.sort) {
            case 'recent':
                this.recent(items);
                break;
            case 'older':
                this.older(items);
                break;
            case 'popular':
                this.popular(items);
                break;
            case 'unpopular':
                this.unpopular(items);
                break;
            default:
                this.recent(items);
        }
        return items.slice(paging.start, (paging.start + paging.count));
    };

    /*Manager.prototype.search = function (filters, paging) {
     var all = this.manager.find(function (artifact) {
     var expected, field, actual;
     for (field in filters) {
     if (filters.hasOwnProperty(field)) {
     expected = filters[field];
     actual = artifact.attribute(field);
     if (expected instanceof RegExp) {
     if (!expected.test(actual)) {
     return false;
     }
     } else {
     return expected == actual;
     }
     }
     }
     return true;
     });
     return this.sorter.paginate(all, paging);
     };*/

    Manager.prototype.search = function (options, paging) {
        return search(this, options).slice(paging.start, (paging.start + paging.count));
    };

    /*
     * Assets matching the filter
     */
    Manager.prototype.get = function (options) {
        var resource = this.registry.get(options);
        return this.manager.get(resource.uuid);
    };

    /*
     * Assets matching the filter
     */
    Manager.prototype.add = function (options) {
        return this.manager.add(options);
    };

    /*
     * Assets matching the filter
     */
    Manager.prototype.update = function (options) {
        return this.manager.update(options);
    };

    /*
     * Assets matching the filter
     */
    Manager.prototype.list = function (paging) {
        var all = this.manager.list(paging);
        var paginated = this.sorter.paginate(all, paging);
        for (var i = 0; i < paginated.length; i++) {
            var asset = paginated[i];
            var user = this.user.current();
            asset.rating = this.registry.rating(asset.path, user ? user.username : null);
        }
        return paginated;
    };

    Manager.prototype.count = function (options) {
        if (options) {
            return search(this, options).length;
        }
        return this.manager.count();
    };

    /*
     *
     * Add comment
     Manager.prototype.comment = function (path, comment) {
     this.registry.comment(path, comment);
     };

     */
    /**
     * Get comments
     */
    /*

     Manager.prototype.comments = function () {
     return this.registry.comments();
     };

     Manager.prototype.rate = function () {

     };

     Manager.prototype.rating = function () {

     };

     Manager.prototype.invokeAspect = function () {

     };

     Manager.prototype.lifecycles = function () {

     };*/
}());