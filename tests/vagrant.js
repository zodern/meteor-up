var vagrantSSHOpts = {
  UserKnownHostsFile: '/dev/null',
  StrictHostKeyChecking: false,
  PasswordAuthentication: false,
  IdentitiesOnly: true,
};

module.exports = {
  meteor: {
    host: '172.27.1.100',
    user: 'vagrant',
    pem: '.vagrant/machines/meteor/virtualbox/private_key',
    opts: vagrantSSHOpts,
  },
  mongo: {
    host: '172.27.1.101',
    user: 'vagrant',
    pem: '.vagrant/machines/mongo/virtualbox/private_key',
    opts: vagrantSSHOpts,
  },
  proxy: {
    host: '172.27.1.102',
    user: 'vagrant',
    pem: '.vagrant/machines/proxy/virtualbox/private_key',
    opts: vagrantSSHOpts,
  },
};
