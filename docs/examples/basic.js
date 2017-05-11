module.exports = {
  servers: {
    one: {
      host: '1.2.3.4',
      username: 'root',
      pem: './server_key'
    }
  },
  meteor: {
    name: 'Todos',
    path: '../',
    servers: { one: {}},
    buildOptions: {
      serverOnly: true
    },
    env: {
      ROOT_URL: 'https://todos.meteorapp.com',
      MONGO_URL: 'mongodb://localhost/meteor'
    },
    docker: {
      image: 'abernix/meteord:base'
    },
    deployCheckWaitTime: 60
  },
  mongo: {
    port: 27017,
    version: '3.4.1',
    servers: {
      one: {}
    }
  }
};
