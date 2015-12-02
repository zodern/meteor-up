// TODO add this to README and delete this file

export default {
  servers: {
    one: {
      host: '1.2.3.4',
      user: 'root',
      pass: 'toor',
    },
    two: {
      host: '1.2.3.5',
      post: 2222,
      user: 'root',
      pem: './mykey',
    },
  },

  meteor: {
    path: '../',
    servers: {
      one: {},
      two: {env: {}},
    },
    env: {
      ROOT_URL: 'http://myapp.com',
      MONGO_URL: 'mongodb://1.2.3.4:27017/meteor'
    },
    ssl: {
      crt: './bundle.crt',
      key: './private.key',
    },
    docker: {
      image: 'meteorhacks/meteord',
    },
    waitTime: 40,
  },

  mongo: {
    oplog: true,
    port: 27017,
    servers: {
      one: {},
    },
    options: {

    },
  },

  proxy: {
    servers: {
      one: {},
    },
  },
};
