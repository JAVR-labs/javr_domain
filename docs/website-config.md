### Parameters:

- `"name"`: `string` - name of the website
- `"port"`: `number` - port on which the website will be hosted
- `"managers"`: `[]` - list of server managers to communicate with
    - `htmlID`: `string` - ID of the manager, displayed in the front with ' ' instead of '_'.
    - `"mac"`: `string` - mac address on which to send WOL packet.
    - `"ip"`: `string` - IP address of the manager.
    - `"port"`: `number` - port on which the manager is hosted.
- `"autostart"`: `{}` - anything put here will try to start automatically.
    - `"discordBots"`: `[string]` - list of htmlIDs of bots to start.
    - `"servers"`: `[string]` - list of htmlIDs of servers to start.
- `"processEnv"`: `string` - mode in which the website runs (development/production).
- `"rules"`: `{}` - list of rules that define how some features behave (if left undefined = `false`).
    - `"allowTerrariumLedOverride"`: `boolean` - whether to allow terrarium led override menu.
    - `"displayTerrariumCam"`: `boolean` - whether the terrarium camera should be allowed.

### Example config:

```json
{
  "name": "JAVR_Domain",
  "port": 3002,
  "managers": {
    "mainPC": {
      "htmlID": "Test_Server_Manager",
      "mac": "00:D8:61:2F:E2:D7",
      "ip": "192.168.233.50",
      "port": 3001
    },
    "serverHost": {
      "htmlID": "JAVR_Server_Manager",
      "mac": "80:FA:5B:83:12:46",
      "ip": "192.168.233.52",
      "port": 3001
    }
  },
  "autostart": {
    "discordBots": [],
    "servers": []
  },
  "processEnv": "development",
  "rules": {
    "allowTerrariumLedOverride": false,
    "displayTerrariumCam": true
  }
}
```
