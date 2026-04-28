import json
import unicodedata

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

def sort_key(word):
    return remove_accents(word).lower()

path = r"c:\Users\pmont\OneDrive\Área de Trabalho\Letrox\palavras_letrox.json"

words_to_add = [
    "efe", "agá", "jota", "eme", "ene", "erre", "dábliu", "ípsilon", 
    "zero", "quatro", "cinco", "seis", "sete", "oito", "nove", 
    "dez", "onze", "doze", "treze", "quatorze", "quinze", 
    "vinte", "trinta", "quarenta", "sessenta", "setenta", 
    "oitenta", "noventa", "duzentos"
]

# Ler o arquivo JSON atual
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Adicionar as novas palavras separadas pelo tamanho
for word in words_to_add:
    length = str(len(word))
    if length not in data:
        data[length] = []
    if word not in data[length]:
        data[length].append(word)

# Reorganizar as listas
for key in data:
    # Remover duplicatas caso existam
    data[key] = list(set(data[key]))
    
    # Ordenar em ordem alfabética ignorando acentos
    data[key].sort(key=sort_key)

# Salvar de volta no arquivo
with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)
