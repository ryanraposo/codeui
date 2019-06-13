import json_tools as jt

def title_fix(title):
        count = 0
        parts = []
        for letter in title:
                if count != 0:
                        if letter.isupper():
                                part = title[:count]
                                title = title[count:]
                                parts.append(part)
                                count = 0
                                pass
                count +=1
        
        part = title[:count]
        parts.append(part)
        parts[0] = parts[0].title()
        new_title = ''

        for p in parts:
                new_title += p + " "

        new_title = new_title.rstrip()

        # print(new_title)
        return new_title

def getFirstWordCapitalized(s):
        
        for letter in s[1:]:
                if letter.isupper():
                        s = s[0:s.find(letter)]
                        break

        word = s.title()

        return word


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

                return title

vscode_elements = jt.getDictFromJson('C:/source/codeui/allElements-fix/vscodeUIElements.json')

elements = vscode_elements["Editor"]

new_editor_dict = {}
unique = []

sets = {}

for main_group in vscode_elements.keys():
        
        new_sub_groups = {}

        for key,value in vscode_elements[main_group].items():
                split = key.split(".")
                camel_string = split[0]

                new_sub_group = camelCaseToSpacedTitle(camel_string, True)
                if new_sub_group == main_group:
                        new_sub_group == "General"
                if not new_sub_group in new_sub_groups:
                        if not new_sub_group == "":
                                new_sub_groups[new_sub_group] = {}

                vscode_elements[main_group][key]['subgroup'] = new_sub_group

        sets[main_group] = new_sub_groups



for group,subgroups in sets.items():
        elements_for_subgroup = {}        
        for sub, elements in sets[group].items():
                for elementname,elementdetails in vscode_elements[group].items():
                        if elementdetails["subgroup"] == sub:
                                sets[group][sub][elementname] = vscode_elements[group][elementname]

jt.writeDictToJsonFile(sets, "C:/users/ryan/desktop/sets.json")        
