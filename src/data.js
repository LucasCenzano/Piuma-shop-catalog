// Importa todas las imágenes
import eclipse from './assets/Eclipse.jpg';
import eclipse2 from './assets/Eclipse-2.jpg';
import estepa from './assets/Estepa.jpg';
import estepa2 from './assets/Estepa-2.jpg';
import sabana from './assets/Sabana.jpg';
import sabana2 from './assets/Sabana-2.jpg';
import sendero from './assets/Sendero.jpg';
import amayra from './assets/Amayra.jpg';
import amayra2 from './assets/Amayra-2.jpg';
import chenson from './assets/Chenson.jpg';
import chenson2 from './assets/Chenson-2.jpg';
import coordenadas from './assets/Coordenadas-duo.jpg';
import coordenadas2 from './assets/Coordenadas-duo-2.jpg';
import isla from './assets/Isla.jpg';
import isla2 from './assets/Isla-2.jpg';
import kioto from './assets/Kioto.jpg';
import kioto2 from './assets/Kioto-2.jpg';
import manhattan from './assets/Manhattan.jpg';
import manhattan2 from './assets/Manhattan-2.jpg';
import mendoza from './assets/Mendoza.jpg';
import mendoza2 from './assets/Mendoza-2.jpg';
import meridiano from './assets/Meridiano.jpg';
import meridiano2 from './assets/Meridiano-2.jpg';
import mykonos from './assets/Mykonos.jpg';
import mykonos2 from './assets/Mykonos-2.jpg';
import mykonos3 from './assets/Mykonos-3.jpg';
import oasis from './assets/Oasis.jpg';
import oasis2 from './assets/Oasis-2.jpg';
import obsidiana from './assets/Obsidiana.jpg';
import obsidiana2 from './assets/Obsidiana-2.jpg';
import paris from './assets/Paris.jpg';
import paris2 from './assets/Paris-2.jpg';
import planisferio from './assets/Planisferio.jpg';
import planisferio2 from './assets/Planisferio-2.jpg';
import squash from './assets/Squash.jpg';
import squash2 from './assets/Squash-2.jpg';
import topografia from './assets/Topografia.jpg';
import topografia2 from './assets/Topografia-2.jpg';
import viaFiore from './assets/ViaFiore.jpg';
import viaFiore2 from './assets/ViaFiore-2.jpg';
import brujula from './assets/Brujula.jpg';
import coordenadaBilletera from './assets/Coordenada.jpg';
import destino from './assets/Destino.jpg';
import destino2 from './assets/Destino-2.jpg';
import duna from './assets/Duna.jpg';
import duna1 from './assets/Duna-1.jpg';
import duna2 from './assets/Duna-2.jpg';
import duna3 from './assets/Duna-3.jpg';
import lunaderuta from './assets/Lunaderuta2.jpg';
import lunaderuta2 from './assets/Lunaderuta2.jpg';
import lunaderutayRosasdelosvientos from './assets/LunaderutayRosasdelosvientos.jpg';
import lunaderutayRosasdelosvientos2 from './assets/LunaderutayRosadelosvientos-2.jpg';
import lunaderutaAtlasyTravesia from './assets/LunaderutaAtlasyTravesia.jpg';
import lunaderutaAtlasyTravesia2 from './assets/LunaderutaAtlasyTravesia-2.jpg';
import lunaderutaAtlasyTravesia3 from './assets/LunaderutaAtlasyTravesia-3.jpg';
import mapamundi from './assets/Mapamundi.jpg';
import mapamundi2 from './assets/Mapamundi-2.jpg';
import orion from './assets/Orion.jpg';
import orion2 from './assets/Orion-2.jpg';
import rosadelosvientos from './assets/Rosadelosvientos.jpg';
import saharayLunaderuta from './assets/SaharayLunaderuta.jpg';
import saharayLunaderuta2 from './assets/SaharayLunaderuta-2.jpg';
import sahara from './assets/Sahara.jpg';
import travesia from './assets/Travesia.jpg';
import cartagena from './assets/Cartagena.jpg';
import cartagena2 from './assets/Cartagena-2.jpg';
import cordillera from './assets/Cordillera.jpg';
import cordillera2 from './assets/Cordillera-2.jpg';
import polonorte from './assets/Polonorte.jpg';
import polonorte2 from './assets/Polonorte-2.jpg';
import polonorte4 from './assets/Polonorte-4.jpg';
import polonorte5 from './assets/Polonorte-5.jpg';
import ecuador from './assets/Ecuador.jpg';
import ecuador2 from './assets/Ecuador-2.jpg';
import horizonte from './assets/Horizonte.jpg';
import laguna from './assets/Laguna.jpg';
import trotamundos from './assets/Trotamundos.jpg';


const bags = [
  // Bandoleras
  { id: 1, name: "Eclipse", price: "$25.000", imagesUrl: [eclipse, eclipse2], category: "Bandoleras", inStock: true },
  { id: 2, name: "Estepa", price: "$28.000", imagesUrl: [estepa, estepa2], category: "Bandoleras", inStock: true },
  { id: 3, name: "Sabana", price: "$25.000", imagesUrl: [sabana, sabana2], category: "Bandoleras", inStock: true },
  { id: 4, name: "Sendero", price: "$35.000", imagesUrl: [sendero], category: "Bandoleras", inStock: false },
  
  // Carteras
  { id: 5, name: "Amayra", price: "$45.000", imagesUrl: [amayra, amayra2], category: "Carteras", inStock: true },
  { id: 6, name: "Chenson", price: "$35.000", imagesUrl: [chenson, chenson2], category: "Carteras", inStock: true },
  { id: 7, name: "Coordenadas-duo", price: "$30.000", imagesUrl: [coordenadas, coordenadas2], category: "Carteras", inStock: false },
  { id: 8, name: "Isla", price: "$45.000", imagesUrl: [isla, isla2], category: "Carteras", inStock: false },
  { id: 9, name: "Kioto", price: "$45.000", imagesUrl: [kioto, kioto2], category: "Carteras", inStock: false },
  { id: 10, name: "Manhattan", price: "$28.000", imagesUrl: [manhattan, manhattan2], category: "Carteras", inStock: true },
  { id: 11, name: "Mendoza", price: "$40.000", imagesUrl: [mendoza, mendoza2], category: "Carteras", inStock: true },
  { id: 12, name: "Meridiano", price: "$45.000", imagesUrl: [meridiano, meridiano2], category: "Carteras", inStock: true },
  { id: 13, name: "Mykonos", price: "$45.000", imagesUrl: [mykonos, mykonos2, mykonos3], category: "Carteras", inStock: true },
  { id: 14, name: "Oasis", price: "$45.000", imagesUrl: [oasis, oasis2], category: "Carteras", inStock: true },
  { id: 15, name: "Obsidiana", price: "$35.000", imagesUrl: [obsidiana, obsidiana2], category: "Carteras", inStock: true },
  { id: 16, name: "Paris", price: "$50.000", imagesUrl: [paris, paris2], category: "Carteras", inStock: true },
  { id: 17, name: "Planisferio", price: "$45.000", imagesUrl: [planisferio, planisferio2], category: "Carteras", inStock: true },
  { id: 18, name: "Squash", price: "$45.000", imagesUrl: [squash, squash2], category: "Carteras", inStock: true },
  { id: 19, name: "Topografia", price: "$35.000", imagesUrl: [topografia, topografia2], category: "Carteras", inStock: false },
  { id: 20, name: "ViaFiore", price: "$45.000", imagesUrl: [viaFiore, viaFiore2], category: "Carteras", inStock: true },

  // Billeteras
  { id: 21, name: "Brujula", price: "$20.000", imagesUrl: [brujula], category: "Billeteras", inStock: true },
  { id: 22, name: "Coordenada", price: "$15.000", imagesUrl: [coordenadaBilletera], category: "Billeteras", inStock: true },
  { id: 23, name: "Destino", price: "$20.000", imagesUrl: [destino, destino2], category: "Billeteras", inStock: true },
  { id: 24, name: "Duna", price: "$25.000", imagesUrl: [duna, duna1, duna2, duna3], category: "Billeteras", inStock: true },
  { id: 25, name: "Luna de ruta", price: "$23.000", imagesUrl: [lunaderuta, lunaderuta2], category: "Billeteras", inStock: true },
  { id: 26, name: "Luna de ruta y Rosas de los vientos", price: "", imagesUrl: [lunaderutayRosasdelosvientos, lunaderutayRosasdelosvientos2], category: "Billeteras", inStock: true },
  { id: 27, name: "Luna de ruta, Atlas y Travesia", price: "", imagesUrl: [lunaderutaAtlasyTravesia, lunaderutaAtlasyTravesia2, lunaderutaAtlasyTravesia3], category: "Billeteras", inStock: true },
  { id: 28, name: "Mapamundi", price: "$20.000", imagesUrl: [mapamundi, mapamundi2], category: "Billeteras", inStock: true },
  { id: 29, name: "Orion", price: "$20.000", imagesUrl: [orion, orion2], category: "Billeteras", inStock: true },
  { id: 30, name: "Rosa de los vientos", price: "$18.000", imagesUrl: [rosadelosvientos], category: "Billeteras", inStock: true },
  { id: 31, name: "Sahara y Luna de ruta", price: "", imagesUrl: [saharayLunaderuta, saharayLunaderuta2], category: "Billeteras" , inStock: true},
  { id: 32, name: "Sahara", price: "$25.000", imagesUrl: [sahara], category: "Billeteras", inStock: false },
  { id: 33, name: "Travesia", price: "$18.000", imagesUrl: [travesia], category: "Billeteras", inStock: true },
    // Mochilas
  { id: 34, name: "Cartagena", price: "$45.000", imagesUrl: [cartagena, cartagena2], category: "Mochilas", inStock: false },
  { id: 35, name: "Cordillera", price: "$55.000", imagesUrl: [cordillera, cordillera2], category: "Mochilas", inStock: true},
  { id: 36, name: "Polo norte", price: "$35.000", imagesUrl: [polonorte, polonorte2, polonorte4, polonorte5], category: "Mochilas", inStock: true},
    // Rinoneras
  { id: 37, name: "Ecuador", price: "$12.000", imagesUrl: [ecuador, ecuador2], category: "Riñoneras", inStock: true},
  { id: 38, name: "Horizonte", price: "$10.000", imagesUrl: [horizonte], category: "Riñoneras", inStock: false},
    // Porta Celulares
  { id: 39, name: "Laguna", price: "$18.000", imagesUrl: [laguna], category: "Porta Celulares", inStock: false},
  { id: 40, name: "Trotamundos", price: "$10.000", imagesUrl: [trotamundos], category: "Porta Celulares", inStock: true},
];

export default bags;
