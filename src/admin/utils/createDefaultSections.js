/**
 * Script para criar seções padrão no Firestore
 * Execute este script uma vez para inicializar as seções
 */

import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig.js';

const defaultSections = [
  {
    id: 'comece-aqui',
    title: 'COMECE AQUI',
    description: 'Seu primeiro passo no Team HIIT',
    order: 1
  },
  {
    id: 'programas-especiais',
    title: 'EMAGRECIMENTO & DEFINIÇÃO',
    description: 'Queima de gordura e definição muscular',
    order: 2
  },
  {
    id: 'desafios-team-hiit',
    title: 'PERFORMANCE & INTENSIDADE',
    description: 'Desafios intensos para testar seus limites.',
    order: 3
  },
  {
    id: 'in-shape',
    title: 'MUSCULAÇÃO & HIPERTROFIA',
    description: 'Para ganhar massa magra e tonificar o corpo',
    order: 4
  },
  {
    id: 'programas-adaptados',
    title: 'PROGRAMAS ADAPTADOS',
    description: 'Para diferentes necessidades e limitações',
    order: 5
  },
  {
    id: 'musculos-especificos',
    title: 'TREINOS LOCALIZADOS',
    description: 'Treinos focados em grupos musculares específicos.',
    order: 6
  },
  {
    id: 'modulos-bonus',
    title: "PlayHIIT'S",
    description: "Playlist's para você montar sua rotina como quiser!",
    order: 7
  }
];

export async function createDefaultSections() {
  try {
    // Verificar se já existem seções
    const existingSections = await getDocs(collection(db, 'training_sections'));
    
    if (existingSections.size > 0) {
      // Verificar se todas as seções padrão já existem
      const existingIds = new Set();
      existingSections.docs.forEach(doc => {
        const data = doc.data();
        if (data.id) {
          existingIds.add(data.id);
        }
      });

      const defaultIds = defaultSections.map(s => s.id);
      const missingSections = defaultSections.filter(s => !existingIds.has(s.id));

      if (missingSections.length === 0) {
        console.log('✅ Todas as seções padrão já existem no Firestore');
        return;
      }

      // Criar apenas as seções que faltam
      if (missingSections.length > 0) {
        const promises = missingSections.map(section => 
          addDoc(collection(db, 'training_sections'), section)
        );
        await Promise.all(promises);
        console.log(`✅ ${missingSections.length} seções padrão criadas com sucesso!`);
      }
      return;
    }

    // Criar todas as seções padrão se não existir nenhuma
    const promises = defaultSections.map(section => 
      addDoc(collection(db, 'training_sections'), section)
    );

    await Promise.all(promises);
    console.log('✅ Seções padrão criadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar seções:', error);
    // Não lançar erro para não quebrar a aplicação
  }
}
