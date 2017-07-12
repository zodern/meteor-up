const host = process.env.PROD_SERVER;
const username = process.env.PROD_SERVER_USER;
const pem = process.env.PROD_SERVER_PEM;
const port = parseInt(process.env.PROD_SERVER_PORT, 10) || 22;

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
