# Migrating to newer mup versions

Always run `mup setup` after updating Meteor Up.

## 1.4

### Depreciations

`meteor.ssl`, `meteor.nginx`, and `meteor.docker.imageFrontendServer` are depreciated. It uses a different implementation for custom certificates and lets encrypt, each with different features and restrictions. Also, the custom certificate implementation has security problems. The reverse proxy should be used instead. It doesn't have the security problems, uses the same implementation for custom certificates and lets encrypt, and has many additional features. Learn how to use the [reverse proxy in the docs](http://meteor-up.com/docs#reverse-proxy).

`proxy.shared.clientUploadLimit` is depreciated. Use `proxy.clientUploadLimit` instead, which allows each app to have a different value.
