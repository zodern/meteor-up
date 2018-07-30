export const VALIDATE_OPTIONS = {
  abortEarly: false,
  convert: false,
  noDefaults: true
};

export function improveErrors(error) {
  // Todo: we can configure the joi messages instead of this
  if (error.type === 'object.allowUnknown') {
    error.message = error.message.replace(
      ' is not allowed',
      ' is an unknown property'
    );
  } else if (error.type === 'object.without') {
    error.message = error.message.replace(
      ' conflict with forbidden peer ',
      ' and '
    );
    error.message += ' cannot both be defined';
  } else if (error.type === 'object.min') {
    error.message = error.message.replace('.value', '');
  }

  return error;
}

export function addLocation(details, location) {
  return details.map(detail => {
    const detailPath = detail.path instanceof Array ? detail.path.join('.') : detail.path;
    const pathSeperator = detailPath.length > 0 ? '.' : '';

    // removes property name from message since it is
    // already part of detail.path
    detail.message = detail.message.replace(/^".*?"\s+/, '');

    detail.message = `"${location}${pathSeperator}${detailPath}" ${detail.message}`;

    return detail;
  });
}

export function combineErrorDetails(details, results) {
  if (results instanceof Array) {
    return details.concat(results);
  }

  const additionalDetails = results.error ? results.error.details : [];

  return details.concat(additionalDetails);
}

export function serversExist(serversConfig = {}, serversUsed = {}) {
  const messages = [];
  const servers = Object.keys(serversConfig);
  const using = Object.keys(serversUsed);
  using.forEach(key => {
    if (servers.indexOf(key) === -1) {
      messages.push({
        message: `Server "${key}" doesn't exist`,
        path: 'servers'
      });
    }
  });

  return messages;
}

export function addDepreciation(details, path, reason, link) {
  details.push({
    type: 'depreciation',
    path,
    message: `${reason}\n  Learn more at ${link}`
  });

  return details;
}
