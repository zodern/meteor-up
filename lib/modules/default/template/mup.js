module.exports = {
  servers: {
    one: {
      host: '1.2.3.4',
      user: 'root',
      pass: 'toor',
      // pem: './mykey',
    },
  },

  meteor: {
    name: 'myapp',
    path: '../',
    servers: {
      one: {},
    },
    env: {
      ROOT_URL: 'http://myapp.com',
      MONGO_URL: 'mongodb://localhost/meteor'
    },
  },

  mongo: {
    oplog: true,
    port: 27017,
    servers: {
      one: {},
    },
  },
};
