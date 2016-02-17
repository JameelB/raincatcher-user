/**
* CONFIDENTIAL
* Copyright 2016 Red Hat, Inc. and/or its affiliates.
* This is unpublished proprietary source code of Red Hat.
**/
'use strict';

var express = require('express')
  , config = require('../config')
  ;

function initRouter(mediator) {
  var router = express.Router();

  router.all('/auth', function(req, res, next) {
    var params = req.body; // params.userId params.password
    if (params && (params.userId || params.username)) {
      var username = params.userId || params.username;
      console.log('Checking credentials for user ' + username);
      mediator.request('user:username:load', username)
      .then(function(profileData) {
        console.log('Valid credentials for user ' + username);
        res.json({
          status: 'ok',
          userId: username,
          sessionToken: username + '_sessiontoken',
          authResponse: profileData
        });
      }, function(err) {
        console.log('Invalid credentials for user ' + username);
        res.status(400);
        res.json({message: 'Invalid credentials'});
      });
    } else {
      console.log('No username provided');
      res.status(400);
      res.json({message: 'Invalid credentials'});
    };
  });

  router.all('/verifysession', function(req, res, next) {
    res.json({
      isValid: true
    });
  });

  router.all('/revokesession', function(req, res, next) {
    res.json({});
  });

  router.route('/').get(function(req, res, next) {
    mediator.once('done:user:list:load', function(data) {
      res.json(data);
    });
    mediator.publish('user:list:load');
  });
  router.route('/:id').get(function(req, res, next) {
    var userId = req.params.id
    mediator.once('done:user:load:' + userId, function(data) {
      res.json(data);
    });
    mediator.publish('user:load', userId);
  });
  router.route('/:id').put(function(req, res, next) {
    var userId = req.params.id;
    var user = req.body;
    // console.log('req.body', req.body);
    mediator.once('done:user:save:' + userId, function(saveduser) {
      res.json(saveduser);
    });
    mediator.publish('user:save', user);
  });
  router.route('/').post(function(req, res, next) {
    var ts = new Date().getTime();  // TODO: replace this with a proper uniqe (eg. a cuid)
    var user = req.body;
    user.createdTs = ts;
    mediator.once('done:user:create:' + ts, function(createduser) {
      res.json(createduser);
    });
    mediator.publish('user:create', user);
  });

  return router;
};

module.exports = function(mediator, app) {
  var router = initRouter(mediator);
  app.use(config.apiPath, router);
};
