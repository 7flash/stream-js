var stream = require('../../../src/getstream')
  , errors = require('../../../src/getstream').errors
  , expect = require('expect.js')
  , init = require('../utils/hooks').init
  , Promise = require('../../../src/lib/promise')
  , utils = require('../utils/index')
  , beforeEachFn = require('../utils/hooks').beforeEach;

describe('Stream client (Faye)', function() {

    init.call(this);
    beforeEach(beforeEachFn);

    it('fayeGetClient', function() {
        this.user1.getFayeClient();
    });

    it('fayeSubscribe', function() {
        this.timeout(6000);

        return this.user1.subscribe(function callback() {});
    });

    it('fayeSubscribeListening', function(done) {
        this.timeout(6000);

        var testUser1 = utils.feed(this.client, 'user', '111'),
            testUser2 = utils.feed(this.client, 'user', '222'),
            testUser3 = utils.feed(this.client, 'user', '333');

        var subscribes = [],
            messages = 0,
            N_MESSAGES = 3,
            activity = {
                'verb': 'test',
                'actor': 'User:1',
                'object': 1
            };

        var msgCallback = function(message) {
            if (message && message['new'] && message['new'].length > 0) {
                messages += 1;
            }

            if (messages == N_MESSAGES) {
                done();
            }
        };

        var httpCallback = function(error, response, body) {
            if (error) done(error);
            if (response.statusCode !== 201) done(body);
        };

        Promise.all([
            testUser1.subscribe(msgCallback),
            testUser2.subscribe(msgCallback),
            testUser3.subscribe(msgCallback)
        ]).then(function() {
            testUser1.addActivity(activity, httpCallback);
            testUser2.addActivity(activity, httpCallback);
            testUser3.addActivity(activity, httpCallback);
        }, done);
    });

    it('fayeSubscribeListeningWrongToken', function(done) {
        this.timeout(10000);

        // Invalid token:
        var testUser1 = this.client.feed('user', '111', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyZXNvdXJjZSI6IioiLCJhY3Rpb24iOiIqIiwiZmVlZF9pZCI6InVzZXIyMjIifQ.WXZTbUgxfitUVwJOhRKu9HRnpf-Je8AwA5BmiUG6vYY'),
            // Valid token:
            testUser2 = utils.feed(this.client, 'user', '222');

        var messages = 0,
            activity = {
                'verb': 'test',
                'actor': 'User:1',
                'object': 1
            };

        var httpCallback = function(error, response, body) {
            if (error) done(error);
            if (response.statusCode !== 201) done(body);
        };

        var doneYet = function(obj) {
            messages++;

            if (messages === 2) done();
        };

        testUser1.subscribe(function(message) {
            done('testUser1 should not receive any messages');
        }).then(function() {
            done('testUser1 should not authenticate succefully');
        }, doneYet);

        testUser2.subscribe(doneYet).then(function() {
            testUser2.addActivity(activity, httpCallback);
        }, done);

    });

    it('fayeSubscribeScope', function(done) {
        this.timeout(6000);
        var client = this.user1ReadOnly.getFayeClient();
        var isDone = false;

        var doneYet = function() {
            if (!isDone) {
                done();
                isDone = true;
            }
        };

        var subscription = this.user1ReadOnly.subscribe(doneYet);
        subscription.then(doneYet);
    });

    it('fayeSubscribeScopeTampered', function(done) {
        this.timeout(6000);
        var client = this.user1ReadOnly.getFayeClient();
        var isDone = false;

        var doneYet = function() {
            if (!isDone) {
                done();
                isDone = true;
            }
        };
        var subscription = this.user1ReadOnly.subscribe(doneYet);
        subscription.then(doneYet);
    });

    it('fayeSubscribeError', function(done) {
        this.timeout(6000);

        var client = stream.connect('5crf3bhfzesn');

        function sub() {
            var user1 = client.feed('user', '11', 'secret');
            user1.subscribe();
        }
        expect(sub).to.throwException(function(e) {
            expect(e).to.be.a(errors.SiteError);
        });
        done();
    });

});