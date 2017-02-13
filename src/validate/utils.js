export function improveErrors(error) {
  if (error.type === 'object.allowUnknown') {
    error.message = error.message.replace(
      ' is not allowed',
      ' is an unknown property'
    );
    error.warning = true;
  } else if (error.type === 'object.without') {
    error.message = error.message.replace(
      ' conflict with forbidden peer ',
      ' and '
    ) +
      ' cannot both be defined';
  }

  return error;
}

export function addLocation(details, location) {
  return details.map(detail => {
    detail.message = `In "${location}", ${detail.message}`;
    return detail;
  });
}

export function combineErrorDetails(details, results) {
  if (results instanceof Array) {
    return details.concat(results);
  }

  let additionalDetails = results.error ? results.error.details : [];
  return details.concat(additionalDetails);
}

export function serversExist(serversConfig, serversUsed) {
  let messages = [];
  let servers = Object.keys(serversConfig);
  let using = Object.keys(serversUsed);
  using.forEach(key => {
    if (servers.indexOf(key) === -1) {
      messages.push({
        message: `Server "${key}" doesn't exist`
      });
    }
  });

  return messages;
}
