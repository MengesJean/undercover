// Undercover seeder — 400 word pairs across 10 French categories.
// Idempotent: uses upsert on the (civilianWord, undercoverWord) unique constraint.
// Run via `npx prisma db seed` (configured in package.json).

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";

loadEnv();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

type Pair = [string, string];
type Cat = { name: string; pairs: Pair[] };

const CATEGORIES: Cat[] = [
  {
    name: "Nourriture",
    pairs: [
      ["Pizza", "Tarte"], ["Café", "Thé"], ["Croissant", "Brioche"],
      ["Pomme", "Poire"], ["Fraise", "Framboise"], ["Yaourt", "Fromage blanc"],
      ["Pain", "Baguette"], ["Beurre", "Margarine"], ["Salade", "Épinard"],
      ["Tomate", "Poivron"], ["Concombre", "Courgette"], ["Spaghetti", "Tagliatelle"],
      ["Riz", "Quinoa"], ["Steak", "Escalope"], ["Saumon", "Truite"],
      ["Crevette", "Langoustine"], ["Hamburger", "Sandwich"], ["Crêpe", "Galette"],
      ["Tiramisu", "Cheesecake"], ["Glace", "Sorbet"],
      ["Chocolat", "Caramel"], ["Bonbon", "Chewing-gum"], ["Biscuit", "Cookie"],
      ["Gâteau", "Cake"], ["Quiche", "Pissaladière"], ["Confiture", "Miel"],
      ["Lait", "Crème"], ["Cappuccino", "Latte"], ["Limonade", "Soda"],
      ["Vin", "Champagne"], ["Bière", "Cidre"], ["Eau plate", "Eau gazeuse"],
      ["Jus d'orange", "Jus de pomme"], ["Soupe", "Bouillon"], ["Ratatouille", "Couscous"],
      ["Paella", "Risotto"], ["Sushi", "Maki"], ["Tacos", "Burrito"],
      ["Omelette", "Quiche lorraine"], ["Poulet rôti", "Poulet frit"],
    ],
  },
  {
    name: "Animaux",
    pairs: [
      ["Chat", "Tigre"], ["Chien", "Loup"], ["Lion", "Lionne"],
      ["Vache", "Bison"], ["Cheval", "Âne"], ["Mouton", "Chèvre"],
      ["Poule", "Dinde"], ["Canard", "Oie"], ["Pigeon", "Tourterelle"],
      ["Aigle", "Faucon"], ["Hibou", "Chouette"], ["Perroquet", "Toucan"],
      ["Requin", "Dauphin"], ["Baleine", "Orque"], ["Poisson rouge", "Carpe"],
      ["Crabe", "Homard"], ["Pieuvre", "Calamar"], ["Tortue", "Crocodile"],
      ["Serpent", "Lézard"], ["Grenouille", "Crapaud"], ["Lapin", "Lièvre"],
      ["Souris", "Rat"], ["Hamster", "Cochon d'Inde"], ["Écureuil", "Marmotte"],
      ["Ours", "Panda"], ["Panthère", "Léopard"], ["Girafe", "Zèbre"],
      ["Éléphant", "Mammouth"], ["Singe", "Gorille"], ["Kangourou", "Wallaby"],
      ["Renard", "Coyote"], ["Cerf", "Biche"], ["Sanglier", "Cochon"],
      ["Hérisson", "Tatou"], ["Abeille", "Guêpe"], ["Papillon", "Libellule"],
      ["Fourmi", "Termite"], ["Coccinelle", "Scarabée"], ["Araignée", "Scorpion"],
      ["Pingouin", "Manchot"],
    ],
  },
  {
    name: "Objets",
    pairs: [
      ["Stylo", "Crayon"], ["Cahier", "Carnet"], ["Livre", "Magazine"],
      ["Ordinateur", "Tablette"], ["Téléphone", "Smartphone"], ["Clavier", "Souris"],
      ["Écran", "Téléviseur"], ["Casque", "Écouteurs"], ["Micro", "Haut-parleur"],
      ["Lampe", "Bougie"], ["Chaise", "Tabouret"], ["Table", "Bureau"],
      ["Canapé", "Fauteuil"], ["Lit", "Hamac"], ["Oreiller", "Coussin"],
      ["Couverture", "Plaid"], ["Miroir", "Cadre"], ["Horloge", "Réveil"],
      ["Montre", "Bracelet"], ["Sac", "Sac à dos"], ["Portefeuille", "Porte-monnaie"],
      ["Clé", "Cadenas"], ["Parapluie", "Parasol"], ["Lunettes", "Loupe"],
      ["Tasse", "Mug"], ["Verre", "Flûte"], ["Assiette", "Bol"],
      ["Fourchette", "Cuillère"], ["Couteau", "Sabre"], ["Casserole", "Poêle"],
      ["Marteau", "Tournevis"], ["Pince", "Tenaille"], ["Scie", "Hache"],
      ["Échelle", "Escabeau"], ["Brouette", "Charriot"], ["Aspirateur", "Balai"],
      ["Sèche-cheveux", "Ventilateur"], ["Radiateur", "Climatiseur"], ["Valise", "Malle"],
      ["Boussole", "GPS"],
    ],
  },
  {
    name: "Lieux",
    pairs: [
      ["Plage", "Désert"], ["Forêt", "Jungle"], ["Montagne", "Colline"],
      ["Rivière", "Fleuve"], ["Lac", "Étang"], ["Mer", "Océan"],
      ["Île", "Péninsule"], ["Vallée", "Canyon"], ["Cascade", "Source"],
      ["Grotte", "Tunnel"], ["Volcan", "Geyser"], ["Glacier", "Iceberg"],
      ["Marais", "Mangrove"], ["Prairie", "Savane"], ["Champ", "Verger"],
      ["Jardin", "Parc"], ["Place", "Esplanade"], ["Rue", "Avenue"],
      ["Boulevard", "Allée"], ["Ruelle", "Impasse"], ["Pont", "Viaduc"],
      ["Tour", "Gratte-ciel"], ["Château", "Palais"], ["Église", "Cathédrale"],
      ["Mosquée", "Temple"], ["Musée", "Galerie"], ["Bibliothèque", "Médiathèque"],
      ["Cinéma", "Théâtre"], ["Restaurant", "Brasserie"], ["Bar", "Pub"],
      ["Café", "Salon de thé"], ["École", "Université"], ["Hôpital", "Clinique"],
      ["Pharmacie", "Parapharmacie"], ["Boulangerie", "Pâtisserie"], ["Supermarché", "Épicerie"],
      ["Marché", "Halle"], ["Stade", "Arène"], ["Aéroport", "Gare"],
      ["Hôtel", "Auberge"],
    ],
  },
  {
    name: "Sports",
    pairs: [
      ["Football", "Rugby"], ["Basketball", "Handball"], ["Tennis", "Badminton"],
      ["Ping-pong", "Squash"], ["Volleyball", "Beach-volley"], ["Baseball", "Cricket"],
      ["Golf", "Mini-golf"], ["Hockey", "Crosse"], ["Ski", "Snowboard"],
      ["Patinage", "Roller"], ["Surf", "Bodyboard"], ["Plongée", "Apnée"],
      ["Natation", "Aquagym"], ["Voile", "Aviron"], ["Canoë", "Kayak"],
      ["Course", "Marche"], ["Marathon", "Trail"], ["Athlétisme", "Triathlon"],
      ["Saut en hauteur", "Saut en longueur"], ["Lancer de poids", "Lancer de javelot"],
      ["Boxe", "Karaté"], ["Judo", "Aïkido"], ["Lutte", "Sumo"],
      ["Escrime", "Kendo"], ["Tir à l'arc", "Tir au pistolet"], ["Yoga", "Pilates"],
      ["Danse", "Ballet"], ["Gymnastique", "Acrobatie"], ["Trampoline", "Parkour"],
      ["Équitation", "Polo"], ["Course automobile", "Moto-cross"],
      ["VTT", "Cyclisme"], ["BMX", "Skateboard"], ["Escalade", "Spéléologie"],
      ["Randonnée", "Alpinisme"], ["Pêche", "Chasse"], ["Pétanque", "Bowling"],
      ["Échecs", "Dames"], ["Curling", "Biathlon"], ["Parachutisme", "Deltaplane"],
    ],
  },
  {
    name: "Métiers",
    pairs: [
      ["Médecin", "Infirmier"], ["Dentiste", "Orthodontiste"], ["Pharmacien", "Préparateur"],
      ["Vétérinaire", "Toiletteur"], ["Chirurgien", "Anesthésiste"], ["Kinésithérapeute", "Ostéopathe"],
      ["Avocat", "Juriste"], ["Juge", "Procureur"], ["Notaire", "Huissier"],
      ["Policier", "Gendarme"], ["Pompier", "Secouriste"], ["Militaire", "Marin"],
      ["Pilote", "Steward"], ["Mécanicien", "Carrossier"], ["Plombier", "Électricien"],
      ["Menuisier", "Ébéniste"], ["Maçon", "Carreleur"], ["Architecte", "Urbaniste"],
      ["Ingénieur", "Technicien"], ["Développeur", "Designer"], ["Comptable", "Commissaire aux comptes"],
      ["Banquier", "Trader"], ["Vendeur", "Commercial"], ["Caissier", "Hôte de caisse"],
      ["Serveur", "Maître d'hôtel"], ["Cuisinier", "Pâtissier"], ["Boulanger", "Boucher"],
      ["Fleuriste", "Jardinier"], ["Coiffeur", "Barbier"], ["Esthéticien", "Manucure"],
      ["Photographe", "Vidéaste"], ["Journaliste", "Reporter"], ["Écrivain", "Poète"],
      ["Acteur", "Comédien"], ["Chanteur", "Musicien"], ["Peintre", "Sculpteur"],
      ["Professeur", "Instituteur"], ["Bibliothécaire", "Documentaliste"], ["Facteur", "Livreur"],
      ["Chauffeur de taxi", "Chauffeur de bus"],
    ],
  },
  {
    name: "Transports",
    pairs: [
      ["Voiture", "Camionnette"], ["Camion", "Semi-remorque"], ["Bus", "Autocar"],
      ["Tramway", "Métro"], ["Train", "TGV"], ["RER", "Transilien"],
      ["Vélo", "Moto"], ["Scooter", "Mobylette"], ["Trottinette", "Skate"],
      ["Avion", "Hélicoptère"], ["Planeur", "Montgolfière"], ["Fusée", "Navette spatiale"],
      ["Bateau", "Yacht"], ["Voilier", "Catamaran"], ["Paquebot", "Ferry"],
      ["Sous-marin", "Bathyscaphe"], ["Pédalo", "Jet-ski"], ["Gondole", "Pirogue"],
      ["Taxi", "VTC"], ["Limousine", "Berline"], ["4x4", "SUV"],
      ["Cabriolet", "Coupé"], ["Tracteur", "Moissonneuse"], ["Bulldozer", "Pelleteuse"],
      ["Grue", "Téléphérique"], ["Funiculaire", "Télésiège"], ["Ascenseur", "Escalator"],
      ["Skateboard", "Longboard"], ["Roller", "Patin à glace"], ["Char à voile", "Kitesurf"],
      ["Ambulance", "Camion de pompier"], ["Fourgon", "Mini-van"], ["Caravane", "Camping-car"],
      ["Calèche", "Diligence"], ["Traîneau", "Luge"], ["Chameau", "Dromadaire"],
      ["Bateau pneumatique", "Radeau"], ["Hovercraft", "Aéroglisseur"], ["Quad", "Buggy"],
      ["Karting", "Formule 1"],
    ],
  },
  {
    name: "Nature",
    pairs: [
      ["Soleil", "Lune"], ["Étoile", "Planète"], ["Nuage", "Brouillard"],
      ["Pluie", "Neige"], ["Orage", "Tempête"], ["Vent", "Brise"],
      ["Arc-en-ciel", "Aurore boréale"], ["Éclair", "Foudre"], ["Grêle", "Verglas"],
      ["Rosée", "Givre"], ["Aube", "Crépuscule"], ["Saison", "Solstice"],
      ["Printemps", "Été"], ["Automne", "Hiver"], ["Chêne", "Hêtre"],
      ["Sapin", "Épicéa"], ["Bouleau", "Saule"], ["Palmier", "Cocotier"],
      ["Olivier", "Citronnier"], ["Pommier", "Cerisier"], ["Rose", "Pivoine"],
      ["Tulipe", "Jonquille"], ["Lavande", "Romarin"], ["Marguerite", "Pâquerette"],
      ["Coquelicot", "Bleuet"], ["Orchidée", "Lys"], ["Cactus", "Aloès"],
      ["Champignon", "Truffe"], ["Mousse", "Lichen"], ["Algue", "Plancton"],
      ["Pierre", "Caillou"], ["Sable", "Gravier"], ["Terre", "Argile"],
      ["Or", "Argent"], ["Diamant", "Rubis"], ["Cristal", "Quartz"],
      ["Feu", "Braise"], ["Cendre", "Charbon"], ["Lave", "Magma"],
      ["Rocher", "Falaise"],
    ],
  },
  {
    name: "Loisirs",
    pairs: [
      ["Jeu vidéo", "Jeu de société"], ["Cartes", "Dés"], ["Puzzle", "Sudoku"],
      ["Mots croisés", "Mots fléchés"], ["Échecs", "Go"], ["Poker", "Blackjack"],
      ["Roman", "Bande dessinée"], ["Mangas", "Comics"], ["Film", "Série"],
      ["Documentaire", "Reportage"], ["Concert", "Festival"], ["Opéra", "Spectacle"],
      ["Karaoké", "Jam-session"], ["Peinture", "Dessin"], ["Sculpture", "Poterie"],
      ["Origami", "Scrapbooking"], ["Photographie", "Cinéma amateur"], ["Cuisine", "Pâtisserie"],
      ["Jardinage", "Bonsaï"], ["Cueillette", "Récolte"], ["Camping", "Bivouac"],
      ["Randonnée", "Trekking"], ["Voyage", "Croisière"], ["Visite guidée", "Excursion"],
      ["Shopping", "Brocante"], ["Musée", "Exposition"], ["Théâtre amateur", "Improvisation"],
      ["Tricot", "Couture"], ["Broderie", "Crochet"], ["Modélisme", "Maquette"],
      ["Astronomie", "Astrologie"], ["Collection", "Numismatique"], ["Philatélie", "Cartophilie"],
      ["Magie", "Jonglerie"], ["Yoga", "Méditation"], ["Méditation", "Sophrologie"],
      ["Apnée", "Plongée libre"], ["Géocaching", "Course d'orientation"], ["Escape game", "Murder party"],
      ["Lecture", "Audiolivre"],
    ],
  },
  {
    name: "Vêtements",
    pairs: [
      ["T-shirt", "Polo"], ["Chemise", "Blouse"], ["Pull", "Sweat"],
      ["Veste", "Blazer"], ["Manteau", "Parka"], ["Imperméable", "Trench"],
      ["Pantalon", "Jean"], ["Short", "Bermuda"], ["Jupe", "Robe"],
      ["Combinaison", "Salopette"], ["Costume", "Smoking"], ["Survêtement", "Jogging"],
      ["Pyjama", "Nuisette"], ["Maillot de bain", "Bikini"], ["Caleçon", "Boxer"],
      ["Chaussette", "Bas"], ["Collant", "Leggings"], ["Foulard", "Écharpe"],
      ["Cravate", "Nœud papillon"], ["Ceinture", "Bretelles"], ["Bonnet", "Béret"],
      ["Casquette", "Chapeau"], ["Gants", "Mitaines"], ["Moufles", "Mitaines de four"],
      ["Bottes", "Bottines"], ["Baskets", "Sneakers"], ["Mocassins", "Derbies"],
      ["Sandales", "Tongs"], ["Escarpins", "Ballerines"], ["Chaussons", "Pantoufles"],
      ["Sac à main", "Pochette"], ["Cabas", "Tote bag"], ["Bijou", "Parure"],
      ["Collier", "Pendentif"], ["Boucle d'oreille", "Clou d'oreille"], ["Bague", "Chevalière"],
      ["Bracelet", "Gourmette"], ["Broche", "Pin's"], ["Lunettes de soleil", "Lunettes de vue"],
      ["Cape", "Poncho"],
    ],
  },
];

async function main() {
  let total = 0;
  for (const cat of CATEGORIES) {
    if (cat.pairs.length !== 40) {
      throw new Error(
        `Category "${cat.name}" has ${cat.pairs.length} pairs, expected 40`,
      );
    }
    for (const [civilianWord, undercoverWord] of cat.pairs) {
      await prisma.wordPair.upsert({
        where: {
          civilianWord_undercoverWord: { civilianWord, undercoverWord },
        },
        update: { category: cat.name },
        create: { civilianWord, undercoverWord, category: cat.name },
      });
      total += 1;
    }
    console.log(`  ✔ ${cat.name} (${cat.pairs.length})`);
  }
  console.log(`\nSeeded ${total} word pairs across ${CATEGORIES.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
