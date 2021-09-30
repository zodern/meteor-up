import axios from 'axios';
import debug from 'debug';
import querystring from 'querystring';

const log = debug('mup:docker-registry');

function getHost(registryConfig) {
  return registryConfig.host || 'registry-1.docker.io';
}

function parseWWWAuthenticate(value) {
  // eslint-disable-next-line global-require
  const parsers = require('www-authenticate/lib/parsers');
  const parsed = new parsers.WWW_Authenticate(value);

  if (parsed.err) {
    throw new Error(
      `could not parse WWW-Authenticate header "${value}": ${parsed.err}`
    );
  }

  return parsed;
}

async function login(registryConfig, authConfig) {
  const query = {};
  let url = authConfig.parms.realm;
  if (authConfig.parms.service) {
    query.service = authConfig.parms.service;
  }
  if (authConfig.parms.scope) {
    query.scope = authConfig.parms.scope;
  }

  if (Object.keys(query).length > 0) {
    url += `?${querystring.stringify(query)}`;
  }

  log(`Requesting token from ${url}`);

  try {
    const result = await axios.get(url, {
      auth: {
        username: registryConfig.username,
        password: registryConfig.password
      }
    });

    if (result.data.errors) {
      log(JSON.stringify(result.data.errors));
      throw new Error('Unable to authenticate with registry');
    }

    return result.data.token || result.data.access_token;
  } catch (e) {
    console.log('Error while logging in to docker registry:', e.message);
    throw e;
  }
}

async function retryWithAuth(
  registryConfig,
  { url, method, data, headers: _headers = {} }
) {
  const headers = {
    ..._headers
  };
  let host = getHost(registryConfig);

  let tries = 0;
  async function doCall() {
    tries += 1;
    try {
      const result = await axios({
        method,
        data,
        url: `https://${host}${url}`,
        headers
      });

      return result.data;
    } catch (e) {
      // TODO: should retry network errors
      if (!e.response || tries >= 2) {
        log(`Request failed - ${tries} tries`);
        if (e.response) {
          log(JSON.stringify(e.response.data));
        }

        throw e;
      }

      const authHeader = e.response.headers['www-authenticate'];
      if (e.response.status !== 401 || !authHeader) {
        log(`Request failed - ${e.response.status} - auth header: ${authHeader}`);
        throw e;
      }

      const parsed = parseWWWAuthenticate(authHeader);
      if (parsed.scheme !== 'Bearer') {
        log(`Unsupported authentication scheme: ${parsed.scheme}`);
        throw e;
      }

      const token = await login(registryConfig, parsed);
      headers.authorization = `Bearer ${token}`;

      return doCall();
    }
  }

  return doCall();
}

export async function checkCompatible(registryConfig) {
  try {
    const host = getHost(registryConfig);
    await axios.get(`https://${host}/v2`);
    log(host);

    // We don't know if this registry uses an authentication method we support
    log('Not compatible - request did not fail');

    return false;
  } catch (e) {
    if (!e.response) {
      // Was a network error.
      log(`compatible err: ${e.message}`);
      throw e;
    }

    if (e.response.status !== 401) {
      // If the registry supports the v2 api, it should return a 401 error
      // since we didn't authenticate
      log('response code not 401, not compatible');

      return false;
    }

    const authenticateHeader = e.response.headers['www-authenticate'];
    if (!authenticateHeader) {
      log('no authenticate header, not compatible');

      return false;
    }

    const parsed = parseWWWAuthenticate(authenticateHeader);

    // This is the only auth method we currently support. As we come across
    // others used by registries we will add support for them.
    if (parsed.scheme === 'Bearer') {
      return true;
    }

    log('not compatible - scheme is not "Bearer"');

    return false;
  }
}

export async function renameTag({
  registryConfig,
  image,
  oldTag,
  newTag,
  ignoreIfMissing = false
}) {
  if (image.indexOf(registryConfig.host) === 0) {
    image = image.slice(registryConfig.host.length);
  }

  log(`Renaming tag: ${image}:${oldTag} -> ${newTag}`);

  let manifest;
  try {
    manifest = await retryWithAuth(registryConfig, {
      url: `/v2/${image}/manifests/${oldTag}`,
      method: 'GET',
      headers: {
        accept: 'application/vnd.docker.distribution.manifest.v2+json'
      }
    });
  } catch (e) {
    if (
      e.response && e.response.status === 404 &&
      ignoreIfMissing
    ) {
      // Tag we are renaming doesn't exist
      return;
    }

    throw e;
  }

  await retryWithAuth(registryConfig, {
    url: `/v2/${image}/manifests/${newTag}`,
    method: 'PUT',
    headers: {
      'content-type': 'application/vnd.docker.distribution.manifest.v2+json'
    },
    data: manifest
  });
}
