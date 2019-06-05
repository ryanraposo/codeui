plan:

- read settings.json
    - function: read settings.json
    - function: parse settings.json

- write settings.json when a value is changed
    - function: write to settings.json

- update tree with items found in parsed settings.json
    - function: for new item in parsedJson: new Element(..., ..., ..., {title: "", description = item, command: ""})
              : for changed item in parsedJson: find tree[item], tree[item].description = parsedJson[item]
              : write settings.json

- listen for changes to settings.json
    - onFileChanged: update tree

1. refresh()
2. getCustomizedElements()
3. setCustomizedElements()
a) get label (name) and description (color)
    b)write that to settings.json
        -format label, name to jsonObject
        -check if label exists in settings.json, if so, modify that key's value
            if not, add that key & value
    c)getCustomizedElements()

