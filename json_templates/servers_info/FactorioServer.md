## Factorio Server: `"factorio"`: `[]`

- `[]` - list of servers.
    - `"port"`: `int` - port on which the server will be hosted.
    - `"htmlID"`: `string` - server's ID, used in logs, frontend, if object has no `displayName` and communication with backend.
    - `"displayName"`: `string` - name of the server displayed on front.
    - `"maxPlayers"`: `int` - maximum number of players allowed on the server.
    - `"filePath"`: `string path` - path to server's executable file.
    - `"startArgs"`: `string[]` - arguments passed when launching the file.
    - `"startingTime"`: `int` - maximum time the server can be starting in minutes. After that time has passed server will be considered offline. Has to be enabled with startServer(`true`).
    - `"cmd"`: `boolean` - whether to use cmd to launch the server.
    - `"debug"`: `boolean` - whether to launch server in debug mode (prints server console).
    - `"config"`: `string` - name of the server's configuration file (server-settings.json).
    - `"world"`: `string` - name or path of the world/save file to load.

### Example:

```json
{
  "factorio": [
    {
      "port": 34197,
      "htmlID": "factorio-server",
      "displayName": "Factorio",
      "filePath": "D:\\SteamLibrary\\steamapps\\common\\Factorio\\bin\\x64\\factorio.exe",
      "startArgs": [],
      "world": "karas.zip",
      "config": "server-settings.json",
      "startingTime": 2
    }
  ]
}
```