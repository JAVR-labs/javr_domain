## 8. `"tsserver"`: `{}`

- `[]` - list of servers.
    - `"port"`: `int` - port on which the server will be hosted.
    - `"htmlID"`: `string` - server's ID, used in logs, frontend, if object has no `displayName` and communication with backend.
    - `"displayName"`: `string` - name of the server displayed on front.
    - `"filePath"`: `string path` - path to server's executable file.
    - `"startingTime"`: `int` - maximum time the server can be starting in minutes. After that time has passed server will be considered offline. Has to be enabled with startServer(`true`).

### Example:

```json
{
  "tsserver": [
    {
      "port": 9987,
      "htmlID": "teamspeak-main",
      "displayName": "TeamSpeak 3 Server",
      "filePath": "D:\\serwery\\teamspeak3-server_win64\\ts3server.exe",
      "startingTime": 3
    }
  ]
}
```