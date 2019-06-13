import json

def getDictFromJson(path):

    text = ''
    with open(path) as jfile:
        for line in jfile:
            text += line + "\n"

    json_object = json.loads(text)

    return json_object

def writeDictToJsonFile(dictionary, path):

    json_string = json.dumps(dictionary, indent=4)

    with open(path, 'w') as new_file:
        new_file.write(json_string)
            
# def getElementDataFromMSPage():
        
        elements = []

        items_and_descriptions = {}

        doc = open("C:/source/codeui/allElements-fix/ms-page.html")
        
        for line in doc:
                if "<code>" in line:
                        start = line.find("<code>")
                        end = line.find("</code>")
                        element = line[start+6:end]
                        description = line[line.find(": ")+2:line.find(".</")]
                        items_and_descriptions[element] = description
                        # elements.append(element)
                        # print(element)
        
        return items_and_descriptions


