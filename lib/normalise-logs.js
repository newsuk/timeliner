/**
 * Maps JSON strings in log entries to full objects
 * and removes the entries from the initial load of `data:`
 * page from the logs
 **/

const url = require('url');

function normalise (lines, pageurl) {
  const host = url.parse(pageurl).host;

  lines = lines.filter((l) => !isNaN(l.timestamp));

  lines = lines.sort((a, b) => a.timestamp < b.timestamp ? -1 : 1);

  lines = lines.slice(getStart(lines, host));

  if (!lines.length) return [];

  const start = lines[0].timestamp;

  lines.forEach(l => {
    l.timestamp -= start;
  });

  return lines;
}

function getStart (lines, host) {
  return lines.reduce((start, line, i) => {
    return start || (isPageLoadLine(line, host) ? i : start);
  }, 0);
}

function isPageLoadLine (line, host) {
  try {
    if (line.message.message.method === 'Network.requestWillBeSent' && url.parse(line.message.message.params.request.url).host === host) {
      return true;
    }
  } catch (e) {}

  return false;
}

module.exports = normalise;
