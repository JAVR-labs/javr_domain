import os
import re


def kebab_to_camel(match):
    parts = match.group(0).split('-')
    return parts[0] + ''.join(word.capitalize() for word in parts[1:])


def convert_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    # Regex to find kebab-case class names
    kebab_case_pattern = re.compile(r'\.[a-z]+(?:-[a-z]+)+')
    new_content = kebab_case_pattern.sub(kebab_to_camel, content)

    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(new_content)


def convert_stylesheets(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.module.scss'):
                file_path = os.path.join(root, file)
                convert_file(file_path)


convert_stylesheets('../')
