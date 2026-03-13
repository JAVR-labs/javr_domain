## Minecraft Server: `"minecraft"`: `[]`

- `[]` - list of servers.
    - `"port"`: `int` - port on which the server will be hosted.
    - `"htmlID"`: `string` - server's ID, used in logs, frontend, if object has no `displayName` and communication with backend.
    - `"displayName"`: `string` - name of the server displayed on front.
    - `"maxPlayers"`: `int` - maximum number of players allowed on the server.
    - `"workingDir"`: `string path` - path to server's directory.
    - `"startArgs"`: `string[]` - arguments passed when launching the file.
    - `"startingTime"`: `int` - maximum time the server can be starting in minutes. After that time has passed server will be considered offline. Has to be enabled with startServer(`true`).
    - `"cmd"`: `boolean` - whether to use cmd to launch the server.
    - `"debug"`: `boolean` - whether to launch server in debug mode (prints server console).
    - `"minecraftVersion"`: `string` - version of minecraft the server is running. (Used to determine which java version should be used)

### Example:

```json
{
  "minecraft": [
    {
      "port": 25565,
      "htmlID": "minecraft-survival",
      "displayName": "Minecraft: Survival Server",
      "maxPlayers": 20,
      "workingDir": "D:\\servers\\minecraft\\survival",
      "startArgs": ["-Xmx4G", "-Xms2G", "-jar", "server.jar", "nogui"],
      "startingTime": 5,
      "cmd": false,
      "debug": false,
      "minecraftVersion": "1.20.1"
    }
  ]
}
```