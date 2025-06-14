## Generic servers: `"generic"`: `[]`

- `[]` - list of servers.
    - `"port"`: `int` - port on which the server will be hosted.
    - `"htmlID"`: `string` - server's ID, used in logs, frontend, if object has no `displayName` and communication with
      backend.
    - `"displayName"`: `string` - name of the server displayed on front.
    - `"maxPlayers"`: `int` - maximum number of players allowed on the server.

### Example:

```json
{
  "generic": [
    {
      "port": 1234,
      "htmlID": "testos",
      "displayName": "Generic: Testos",
      "maxPlayers": 20
    }
  ]
}
```