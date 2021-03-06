const _         = require('lodash');
const redis     = require('redis');
const lru       = require('redis-lru');
const { defer } = require('../../async');

module.exports = (strapi, opts = {}) => {
  const redisOpts = _.pick(opts, ['host', 'port', 'url', 'path', 'password', 'db']);
  const prefix = (key) => `strapi-middleware-cache:${key}`;

  const deferred  = defer();
  const client    = redis.createClient(redisOpts);
  const cache     = lru(client, opts.max);

  client.once("ready", () => {
    strapi.log.info('[Cache] Redis connection established')
    deferred.resolve(true)
  });

  client.once("error", (e) => {
    strapi.log.error(`[Cache] Redis connection failed`)
    strapi.log.error(e);
    return deferred.reject(e)
  });
  
  return  {
    get(key) {
      return cache.get(prefix(key));
    },
    set(key, val, maxAge) {
      return cache.set(prefix(key), val, maxAge);
    },
    peek(key) {
      return cache.peek(prefix(key));
    },
    del(key) {
      return cache.del(prefix(key));
    },
    keys() {
      return cache.keys();
    },
    reset() {
      return cache.reset();
    },
    ready: deferred.promise
  };
}