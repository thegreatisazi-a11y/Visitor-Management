const UAParser = require('ua-parser-js');

module.exports = function requestContext(req, res, next) {
  const forwarded = req.headers['x-forwarded-for'];
  req.clientIp = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

  const parser = new UAParser(req.headers['user-agent'] || '');
  const result = parser.getResult();
  const browser = [result.browser.name, result.browser.version].filter(Boolean).join(' ');
  const os = [result.os.name, result.os.version].filter(Boolean).join(' ');
  const device = result.device.type ? `${result.device.vendor || ''} ${result.device.model || ''}`.trim() : 'Desktop';

  req.deviceInfo = [device, browser, os].filter(Boolean).join(' | ') || 'Unknown Device';

  next();
};
