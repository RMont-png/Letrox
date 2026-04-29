import json
import unicodedata

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

def sort_key(word):
    return remove_accents(word).lower()

path = r"c:\Users\pmont\OneDrive\Área de Trabalho\Letrox\palavras_letrox.json"

words_to_add = [
    "disso", "bota", "bule", "cujo", "elmo", "feno", "hoje", "jade", 
    "logo", "leve", "isso", "item", "menu", "oval", "agora", "agudo", 
    "ainda", "algum", "antro", "arame", "assim", "babar", "aonde", 
    "bravo", "cacto", "clone", "desse", "deste", "estar", "falir", 
    "enjoo", "ereto", "enfim", "fatal", "feder", "fedor", "forca", 
    "fundo", "ganho", "gasto", "gosto", "graal", "horda", "jarro", 
    "lombo", "longe", "lunar", "males", "mesmo", "minha", "mirar", 
    "morto", "musgo", "nasal", "naval", "nesse", "neste", "nevar", 
    "ninar", "nosso", "nuvem", "ontem", "ousar", "pavio", "pedal", 
    "peste", "polar", "polir", "pouco", "prado", "prece", "prole", 
    "quase", "radar", "remar", "rumor", "sabre", "safar", "sarar", 
    "sauna", "senil", "sobre", "sonar", "sucos", "sugar", "talco", 
    "tanta", "tanto", "totem", "truta", "tumor", "tutor", "ultra", 
    "unido", "usual", "vagar", "veado", "viril", "visor", "vocal", 
    "zeros", "abajur", "aberto", "acenar", "afinal", "aflito", 
    "alarde", "alteza", "amarra", "ameixa", "apegar", "apesar", 
    "aposto", "aquele", "astuto", "avante", "banhar", "bastar", 
    "bolada", "brutal", "bruxos", "burlar", "cabide", "cafona", 
    "cajado", "calmos", "camelo", "cantil", "cascos", "casino", 
    "casual", "casulo", "caviar", "cereal", "chupar", "cilada", 
    "clique", "coiote", "colcha", "coldre", "comigo", "contra", 
    "cortez", "cristo", "cupido", "curvar", "dardos", "demais", 
    "dental", "dentre", "dentro", "depois", "despir", "destro", 
    "devoto", "diante", "diesel", "direto", "discar", "dorsal", 
    "drenar", "drogar", "eleito", "elixir", "embora", "enguia", 
    "enxame", "escape", "esnobe", "espeto", "espiar", "estaca", 
    "estase", "estepe", "exceto", "facada", "facial", "festim", 
    "fivela", "franco", "frente", "fritos", "fundir", "garfos", 
    "girafa", "imenso", "jaguar", "jamais", "juntos", "labial", 
    "linear", "lombar", "macios", "madame", "maleta", "malhar", 
    "mamilo", "mamute", "mantra", "mascar", "mentor", "mesada", 
    "mingau", "nenhum", "neural", "pastos", "peludo", "picape", 
    "pomada", "ponche", "porque", "punhal", "quando", "quanto", 
    "rachar", "racial", "ranger", "raptar", "raptor", "redoma", 
    "restar", "risoto", "salame", "saudar", "sempre", "senado", 
    "sensor", "sequer", "serial", "sogros", "soltos", "soprar", 
    "surtar", "talvez", "tossir", "toxina", "trauma", "tribal", 
    "unidos", "valete", "verbal", "versus", "agendar", "alicate", 
    "alistar", "amassos", "aplauso", "arsenal", "aspirar", "avental", 
    "bandana", "barbear", "barbudo", "batedor", "beliche", "bezerro", 
    "bipolar", "bisturi", "bobeira", "bombear", "bondoso", "cadeado", 
    "cadente", "calouro", "canguru", "canhoto", "canibal", "capacho", 
    "capataz", "carinho", "cateter", "centena", "charada", "chupeta", 
    "coberto", "colidir", "comedor", "condado", "conosco", "contido", 
    "contigo", "contudo", "covarde", "coveiro", "cremoso", "crucial", 
    "culatra", "culposo", "cutucar", "daquilo", "debaixo", "decente", 
    "dedurar", "deleite", "delgado", "demolir", "depilar", "detento", 
    "detonar", "devagar", "devorar", "digerir", "dosagem", "drinque", 
    "durante", "emotivo", "encenar", "enfarte", "enseada", "entanto", 
    "esfinge", "esgrima", "esquiar", "estalar", "estande", "esterco", 
    "estrume", "excitar", "extinto", "farejar", "faturar", "flertar", 
    "flutuar", "funeral", "glacial", "golpear", "granizo", "hesitar", 
    "imaturo", "informe", "injetar", "intruso", "invento", "iogurte", 
    "jangada", "jugular", "literal", "lixeiro", "maioral", "maldito", 
    "maldoso", "malvado", "manchar", "manejar", "medonho", "mineral", 
    "mirtilo", "moicano", "moletom", "molusco", "monitor", "naquele", 
    "naquilo", "nevasca", "nupcial", "obsceno", "palitos", "patinar", 
    "perante", "piolhos", "piranha", "punhado", "quietos", "quintal", 
    "raivoso", "raquete", "recital", "sabotar", "samurai", "saquear", 
    "sarjeta", "sedento", "shampoo", "sideral", "soprano", "sudeste", 
    "sujeira", "supremo", "tedioso", "tigresa", "todavia", "tontura", 
    "trivial", "vaidoso", "veleiro", "velejar", "venenos", "vinhedo", 
    "acasalar", "almofada", "aprontar", "arranhar", "arritmia", 
    "arrombar", "avestruz", "barranco", "baunilha", "besouros", 
    "cachecol", "canivete", "carteiro", "castanho", "castigar", 
    "cavalgar", "cervical", "charutos", "chaveiro", "cinzeiro", 
    "clareira", "colossal", "comodoro", "compadre", "comporta", 
    "conforme", "conjugal", "conserva", "consolar", "contanto", 
    "convosco", "corcunda", "costurar", "craniano", "crocante", 
    "desertor", "detector", "dinamite", "discagem", "dolorido", 
    "duplicar", "encolher", "encurtar", "enforcar", "engasgar", 
    "enquanto", "entregue", "escoltar", "esculpir", "espasmos", 
    "espinhal", "espionar", "espirrar", "espremer", "esquivar", 
    "exaustos", "extintor", "farsante", "florence", "fornalha", 
    "gracioso", "grotesco", "guaxinim", "histeria", "homicida", 
    "imperial", "impostor", "inclinar", "indeciso", "infectar", 
    "infernos", "internar", "invernos", "latitude", "lecionar", 
    "legendar", "letreiro", "limusine", "liquidar", "malignos", 
    "manobrar", "mariscos", "marquesa", "mastigar", "maternal", 
    "medieval", "memorial", "nascente", "natalino", "ocidente", 
    "palheiro", "paquerar", "paranoia", "pedestal", "pegajoso", 
    "peitoral", "perfurar", "perplexo", "petiscos", "pinheiro", 
    "pirulito", "portanto", "pradaria", "presumir", "previsto", 
    "primeiro", "projetor", "qualquer", "quiosque", "rastejar", 
    "ratoeira", "receptor", "renomado", "restrito", "roqueiro", 
    "saboroso", "saxofone", "sedativo", "simetria", "sintonia", 
    "soletrar", "sossegar", "sujeitos", "suspenso", "sutileza", 
    "tampouco", "temperos", "torrente", "toureiro", "trompete", 
    "ultimato", "vascular", "venenoso", "veredito", "vertical", 
    "vertigem", "taipa", "taipas", "gosma", "gosmas", "tufo", 
    "tufos", "dela", "delas", "dele"
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
