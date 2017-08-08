const host = process.env.PROD_SERVER || '0.0.0.0';
const username = process.env.PROD_SERVER_USER || 'root';
const pem = process.env.PROD_SERVER_PEM || '../ssh/new';
const port = parseInt(process.env.PROD_SERVER_PORT, 10) || 3500;

module.exports = {
  mymeteor: {
    host,
    username,
    pem,
    opts: {
      port
    }
  },
  mymongo: {
    host,
    username,
    pem,
    opts: {
      port
    }
  },
  myproxy: {
    host,
    username,
    pem,
    opts: {
      port
    }
  }
};
