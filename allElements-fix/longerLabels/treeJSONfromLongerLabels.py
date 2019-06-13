import json_tools as jt

json_object = jt.getDictFromJson('C:/source/codeui/allElements-fix/longerLabels/groupNameLabelDescription.json')

def camelCaseToSpacedTitle(text, first_word_removed):
        
        # if text == "editor":
        #         print('')

        
        first_word_end = -1
        
        if first_word_removed:
                for letter in text:
                        if letter.isupper():
                                first_word_end = text.find(letter)
                                break

                if first_word_end == -1:
                        return text.title()

                first_word = text[:first_word_end]
                text = text.replace(first_word, '')

                

                capital_indexes = [0]
                # prev = 0
                temp = text[1:]
                for letter in temp:
                        if letter.isupper():
                                capital_indexes.append(temp.find(letter) + 1)
                                # prev = temp.find(letter) + 1
                print("")

                previous_index = 0

                words = []

                for index in capital_indexes[1:]:
                        words.append(text[previous_index:index])
                        previous_index = index
                
                words.append(text[previous_index:])

                title = ""

                for word in words:
                        title += word + " "
                
                title = title.rstrip()
        else:

            capital_indexes = [0]
            # prev = 0
            temp = text[1:]
            for letter in temp:
                    if letter.isupper():
                            capital_indexes.append(temp.find(letter) + 1)
                            # prev = temp.find(letter) + 1
            print("")

            previous_index = 0

            words = []

            for index in capital_indexes[1:]:
                    words.append(text[previous_index:index])
                    previous_index = index
            
            words.append(text[previous_index:])

            title = ""

            for word in words:
                    title += word + " "
            
            title = title.rstrip()
            title = title.title()

        return title

def long_label_from_fullname(name):
    
    split = name.split(".")

    full = ""

    for part in split:
        full += " " + camelCaseToSpacedTitle(part, False)

    full = full.strip()

    # Remove first word
    
    full_split = full.split(" ")
    new_full = ""

    c=0
    for part in full_split:
        if c != 0:
            new_full += " " + part
        c+=1

    new_full = new_full.strip()

    return new_full


for key,value in json_object.items():

    group = json_object[key].items()
    print(key.upper())

    for elementName, elementDetails in group:
        name = elementName
        label = json_object[key][elementName]["label"]

        new_label = long_label_from_fullname(elementName)
        print("   " + new_label)

        json_object[key][elementName]["label"] = new_label
        json_object[key][elementName]["group"] = key


jt.writeDictToJsonFile(json_object, 'C:/source/codeui/allElements-fix/longerLabels/groupNameLabelDetails_longLabels.json')