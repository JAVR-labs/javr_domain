## Terraria servers: `"terraria"`: `[]`

- `[]` - list of servers.
    - `"port"`: `int` - port on which the server will be hosted.
  - `"htmlID"`: `string` - server's ID, used in logs, frontend, if object has no `displayName` and communication with
    backend.
    - `"displayName"`: `string` - name of the server displayed on front.
    - `"maxPlayers"`: `int` - maximum number of players allowed on the server.
    - `"filePath"`: `string path` - path to server's executable file (optional if workingDir is provided).
  - `"workingDir"`: `string path` - path to server's directory (if provided, filePath will be auto-resolved to
    TerrariaServer.exe or TerrariaServer based on server's platform).
    - `"startArgs"`: `string[]` - arguments passed when launching the file.
  - `"startingTime"`: `int` - maximum time the server can be starting in minutes. After that time has passed server
    will be considered offline. Has to be enabled with startServer(`true`).
    - `"cmd"`: `boolean` - whether to use cmd to launch the server.
    - `"debug"`: `boolean` - whether to launch server in debug mode (prints server console).
    - `"configPath"`: `string path` - path to a serverconfig file.
    - `"worldPath"`: `string path` - path to world save file.
    - `"motd"`: `string` - message of the day string.
    - `"useSteam"`: `boolean` - whether to use steam lobby.
    - `"lobbyType"`: `string` - what type of steam lobby to use (e.g., "friends", "private").

### Examples:

#### Config layout:

```json
{
  "terraria": [
    {
      "port": 7777,
      "htmlID": "terraria-main",
      "displayName": "Terraria: Main World",
      "workingDir": "D:\\Games\\Terraria\\Server",
      "startArgs": [],
      "startingTime": 3,
      "cmd": false,
      "debug": false,
      "configPath": "D:\\servers\\terraria server\\serverconfig.txt",
      "useSteam": true,
      "lobbyType": "friends"
    }
  ]
}
```

#### Manual layout:

```json
{
  "terraria": [
    {
      "port": 7777,
      "htmlID": "terraria-main",
      "displayName": "Terraria: Main World",
      "maxPlayers": 16,
      "workingDir": "D:\\Games\\Terraria\\Server",
      "startArgs": [],
      "startingTime": 3,
      "worldPath": "D:\\servers\\terraria server\\worlds\\mainworld.wld",
      "motd": "Welcome to the server!"
    }
  ]
}
```
