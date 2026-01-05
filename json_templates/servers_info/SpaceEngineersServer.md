## Space Engineers Server: `"space_engineers"`: `[]`

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
  "space_engineers": [
    {
      "port": 27016,
      "htmlID": "se-survival",
      "displayName": "Space Engineers: Survival Server",
      "filePath": "D:\\servers\\SpaceEngineers\\DedicatedServer64\\SpaceEngineersDedicated.exe",
      "startArgs": ["-console"],
      "startingTime": 5,
      "cmd": false,
      "debug": false
    }
  ]
}
```