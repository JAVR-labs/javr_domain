### Parameters:

- `[]` - list of bots:
  - `"name"`: `string` - name that will be displayed on the website, also used for htmlID (replacing ' ' with '_').
  - `"dirPath"`: `string` - path to the bot's directory (assumes main file is called `main.py`).
  - `"pythonPath"`*: `string path` - optional Path to the `python.exe`. Default is whichever is in system's PATH.

### Example config:

```json
[
  {
    "name": "JAVR Argentino",
    "dirPath": "E:\\GitHub\\JAVR_Bot",
    "pythonPath": "E:\\Python ver\\JAVR_Bot\\Scripts\\python.exe"
  }
]
