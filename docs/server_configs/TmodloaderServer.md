## Tmodloader servers: `"tmodloader"`: `[]`

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
    - `"config"`: `string` - path to a serverconfig file.
    - `"useSteam"`: `boolean` - whether to use steam lobby.
    - `"lobbyType"`: `string` - what type of steam lobby to use.

### Example:

```json
{
  "tmodloader": [
    {
      "port": 7777,
      "htmlID": "terraria-calamity",
      "displayName": "Terraria: Calamity Mod",
      "maxPlayers": 8,
      "workingDir": "D:\\Games\\tModLoader",
      "startArgs": [],
      "startingTime": 5,
      "cmd": false,
      "debug": false,
      "config": "serverconfig.txt",
      "useSteam": false,
      "lobbyType": "friends"
    }
  ]
}
```