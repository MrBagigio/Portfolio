// File: /assets/js/modules/knowledgeBase.js

// Questa è la memoria permanente di A.P.I.S.
// Contiene tutte le informazioni fattuali sul portfolio e sull'operatore.

export const KNOWLEDGE_BASE = {
  operator: {
    name: "Alessandro Giacobbi",
    id: "ALESSANDRO GIACOBBI",
    status: "ATTIVO",
    role: "3D Artist",
    specialization: "3D Environment, Character Design",
    bio: "La mia passione per il 3D nasce dalla volontà di creare mondi e storie immersive. Ogni progetto è un'esplorazione, una sfida tecnica e un'opportunità per dare vita a qualcosa di unico.",
    contact: "alessandro.giacobbi.3d@gmail.com"
  },
  tools: {
    modellazione: ["Maya", "ZBrush", "Blender"],
    texturing: ["Substance Painter"]
  },
  siteSections: {
    hero: "Sezione principale del terminale.",
    projects: "Galleria interattiva dei lavori.",
    about: "Profilo dell'operatore, biografia e specializzazioni.",
    contact: "Informazioni di contatto e toolkit software."
  },
  // La lista dei progetti verrà caricata qui dinamicamente.
  projects: [] 
};

// Funzione per caricare dinamicamente i dati dei progetti nella base di conoscenza.
export async function loadProjectsIntoKB() {
  try {
    const res = await fetch('assets/projects.json');
    if (!res.ok) throw new Error('Network response was not ok');
    const projectData = await res.json();
    KNOWLEDGE_BASE.projects = projectData;
    console.log('[KB] Base di conoscenza aggiornata con i dati dei progetti.');
    return true;
  } catch (error) {
    console.error('[KB] Impossibile caricare i progetti nella base di conoscenza:', error);
    return false;
  }
}