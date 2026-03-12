## Universal information for all server types

### Optional properties:

- `"displayName"`: `string` - if not provided, `htmlID` will be used.
- `"maxPlayers"`: `int` - will generally be assigned after server start. It is still better to specify.
- `"startingTime"`: `int` - maximum time the server can be starting in minutes. After that time has passed server will be considered offline. Has to be enabled with startServer(`true`). Currently not supported from config. Default value `2`.
- `"cmd"`: `boolean` - whether to use cmd to launch the server. Default value `false`.
- `"debug"`: `boolean` - whether to launch server in debug mode (prints server output to console). Default value `false`.