// Challenge content generation using separate content files
import { getQuantumConsciousnessContent } from '@/content/quantum-consciousness';
import { getMoneyManifestationContent } from '@/content/money-manifestation';
import { getQuantumHealthContent } from '@/content/quantum-health';
import { getQuantumRelationshipsContent } from '@/content/quantum-relationships';
import { getMoneyBlocksClearingContent } from '@/content/money-blocks-clearing';

export function generateChallengeContent(day: number, type: string) {
  const contentMap: Record<string, (day: number) => any> = {
    general_quantum: getQuantumConsciousnessContent,
    money_manifestation: getMoneyManifestationContent,
    quantum_health: getQuantumHealthContent,
    quantum_relationships: getQuantumRelationshipsContent,
    money_blocks_clearing: getMoneyBlocksClearingContent,
  };

  const contentFunction = contentMap[type] || contentMap.general_quantum;
  return contentFunction(day);
}