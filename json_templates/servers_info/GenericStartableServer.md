## Generic Executable Server: `"generic_exec"`: `[]`

- `[]` - list of servers.
    - `"port"`: `int` - port on which the server will be hosted.
    - `"htmlID"`: `string` - server's ID, used in logs, frontend, if object has no `displayName` and communication with backend.
    - `"displayName"`: `string` - name of the server displayed on front.
    - `"maxPlayers"`: `int` - maximum number of players allowed on the server.
    - `"filePath"`: `string path` - path to server's executable file.
    - `"workingDir"`: `string path` - path to server's directory. Pass this for servers that require launching multiple files or specific launch procedure.
    - `"startArgs"`: `string[]` - arguments passed when launching the file.
    - `"startingTime"`: `int` - maximum time the server can be starting in minutes. After that time has passed server will be considered offline. Has to be enabled with startServer(`true`).
    - `"cmd"`: `boolean` - whether to use cmd to launch the server.
    - `"debug"`: `boolean` - whether to launch server in debug mode (prints server console).

### Example:

```json
{
  "generic_exec": [
    {
      "port": 8080,
      "htmlID": "generic-exec-test",
      "displayName": "Generic Executable: Test Server",
      "maxPlayers": 50,
      "filePath": "D:\\servers\\generic\\server.exe",
      "startArgs": ["--port", "8080", "--config", "server.cfg"],
      "startingTime": 3,
      "cmd": false,
      "debug": false
    }
  ]
}
```