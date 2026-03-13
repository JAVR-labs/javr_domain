## Ark servers: `"ark"`

- `[]` - list of servers.
    - `"port"`: `int` - port on which the server will be hosted.
    - `"htmlID"`: `string` - server's ID, used in logs, frontend, if object has no `displayName` and communication with backend.
    - `"displayName"`: `string` - name of the server displayed on front.
    - `"filePath"`: `string path` - path to server's executable file.
    - `"startArgs"`: `string[]` - arguments passed when launching the file.
    - `"startingTime"`: `int` - maximum time the server can be starting in minutes. After that time has passed server will be considered offline. Has to be enabled with startServer(`true`).
    - `"cmd"`: `boolean` - whether to use cmd to launch the server.
    - `"debug"`: `boolean` - whether to launch server in debug mode (prints server console).

### Example:

```json
{
  "ark": [
    {
      "port": 7777,
      "htmlID": "ark-island",
      "displayName": "ARK: The Island",
      "filePath": "D:\\serwery\\ARK Server\\ShooterGameServer.exe",
      "workingDir": "D:\\serwery\\ARK Server",
      "startArgs": [
        "TheIsland?listen?SessionName=MyServer?ServerPassword=MyPassword?ServerAdminPassword=MyAdminPassword?Port=7777?QueryPort=27015?MaxPlayers=20"
      ],
      "cmd": true
    }
  ]
}
```