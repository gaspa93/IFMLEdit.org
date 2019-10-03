// Copyright (c) 2017, the IFMLEdit.org project authors. Please see the
// AUTHORS file for details. All rights reserved. Use of this source code is
// governed by the MIT license that can be found in the LICENSE file.
/*jslint node: true, nomen: true */
"use strict";

var _ = require('lodash'),
    almost = require('almost'),
    Rule = almost.Rule,
    createRule = almost.createRule,
    AException = almost.Exception;

exports.rules = [
    createRule(
        Rule.always,
        function (model) {
          var controls = _.chain(model.elements)
                  .filter(function (e) { return model.isViewElement(e); })
                  .value(),
              events = _.chain(model.elements)
                  .filter(function (e) { return model.isEvent(e); })
                  .filter(function (e) { return model.getOutbounds(e).length; })
                  .value(),
              actions = _.chain(model.elements)
                  .filter(function (e) { return model.isAction(e); })
                  .filter(function (a) { return model.getInbounds(a).length; })
                  .value(),
              children = model.getTopLevels(),
              defaultChild = _.chain(children)
                  .filter(function (id) { return model.isDefault(id); })
                  .first()
                  .value(),
              landmarks = _.chain(children)
                  .filter(function (e) { return model.isLandmark(e); })
                  .map(function (id) { return model.toElement(id); })
                  .map(function (e) { return {id: e.id, name: e.attributes.name}; })
                  .value(),
              collections = _.chain(model.elements)
                  .filter(function (e) { return model.isViewComponent(e); })
                  .reject({attributes: {stereotype: 'form'}})
                  .map(function (c) {
                      if (c.attributes.collection) {
                          return c.attributes.collection;
                      }
                      throw new AException('Collection cannot be empty\n(ViewComponent id:' + c.id + ')');
                  })
                  .uniq()
                  .value();
            return {
                '': {isFolder: true, children: 'pyqtexample'},
                'pyqtexample' : { isFolder: true, name: 'pyqtexample', children: ['lib']},
                'lib': {isFolder: true, name: 'lib', children: ['controls']},
                'controls': {isFolder: true, name: 'controls', children: ['main', 'mainapp']},
                'main': {name: 'main.py', content: require('./templates/main.py.ejs')()},
                'mainapp': {name: 'mainapplication.py', content: require('./templates/mainapp.py.ejs')({children: children, defaultChild: defaultChild, landmarks: landmarks})},
                //'widgets': {isFolder: true, name: 'widgets'},
                //'events': {isFolder: true, name: 'events'},
                //'repositories': {isFolder: true, name: 'repositories'},
                //'commands': {name: 'commands.dart', content: require('./templates/commands.dart.ejs')()},
                //'pubspec': {name: 'pubspec.yaml', content: require('./templates/pubspec.yaml.ejs')()},
            };
        }
    ),
    createRule(
      Rule.always,
      function (model) {
          var collections = _.chain(model.elements)
                  .filter(function (e) { return model.isViewComponent(e); })
                  .reject({attributes: {stereotype: 'form'}})
                  .map(function (component) {
                      return {
                          name: component.attributes.collection,
                          fields: _.chain(component.attributes.fields).concat(component.attributes.filters).compact().value()
                      };
                  })
                  .groupBy('name')
                  .values()
                  .map(function (elements) {
                      return {name: _.first(elements).name, fields: _.chain(elements).map('fields').flatten().uniq().value() };
                  })
                  .value(),
              obj = {
                  'repositories': {children: _.map(collections, function (c) { return c.name + '-Repository'; })},
              };
          _.each(collections, function (c) {
              //obj[c.name + '-Repository'] = {isFolder: true, name: c.name, children: [c.name + '-Repository-Index', c.name + '-Repository-Default']};
              //obj[c.name + '-Repository-Index'] = {name: 'index.js', content: require('./templates/repository.js.ejs')({name: c.name})};
              //obj[c.name + '-Repository-Default'] = {name: 'default.json', content: require('./templates/default.json.ejs')({fields: c.fields})};
          });
          return obj;
      }
  )

];
