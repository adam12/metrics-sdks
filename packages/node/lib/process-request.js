const url = require('url');
const removeProperties = require('lodash/omit');
const removeOtherProperties = require('lodash/pick');
const contentType = require('content-type');

const objectToArray = require('./object-to-array');

module.exports = (req, options = {}) => {
  const denylist = options.denylist || options.blacklist;
  const allowlist = options.allowlist || options.whitelist;

  if (denylist) {
    req.body = removeProperties(req.body, denylist);
    req.headers = removeProperties(req.headers, denylist);
  }

  if (allowlist && !denylist) {
    req.body = removeOtherProperties(req.body, allowlist);
    req.headers = removeOtherProperties(req.headers, allowlist);
  }

  const postData = {};
  if (req.body && Object.keys(req.body).length > 0) {
    // parse mimetype from content-type header, default to JSON
    postData.mimeType = 'application/json';
    try {
      postData.mimeType = contentType.parse(req).type;
    } catch (e) {} // eslint-disable-line no-empty

    // Per HAR, we send JSON as postData.text, not params.
    if (postData.mimeType === 'application/json') {
      postData.text = JSON.stringify(req.body);
    } else {
      postData.params = objectToArray(req.body || {});
    }
  }

  return {
    method: req.method,
    url: url.format({
      protocol: req.headers['x-forwarded-proto'] || req.protocol,
      host: req.headers['x-forwarded-host'] || req.get('host'),
      pathname: `${req.baseUrl}${req.path}`,
      query: req.query,
    }),
    httpVersion: `${req.protocol.toUpperCase()}/${req.httpVersion}`,
    headers: objectToArray(req.headers),
    queryString: objectToArray(req.query),
    postData,
  };
};
