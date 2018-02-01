module.exports = {
  servers: {
    one: {
      host: '1.1.1.1',
      username: 'root',
      password: 'test'
    },
    two: {
      host: '2.2.2.2',
      username: 'root',
      password: 'test'
    }
  },
  meteor: {
    servers: {
      one: {}, two: {}
    },
    env: {
      ROOT_URL: 'http://app.com'
    },
    name: 'app',
    path: '../'
  },
  mongo: {
    servers: {
      two: {}
    }
  }
}
