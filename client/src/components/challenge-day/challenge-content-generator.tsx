// Challenge content generation using separate content files
import { getQuantumConsciousnessContent } from '@/components/challenges/quantum-consciousness/quantum-consciousness';
import { getMoneyManifestationContent } from '@/components/challenges/money-manifestation/money-manifestation';
import { getQuantumHealthContent } from '@/components/challenges/quantum-health/quantum-health';
import { getQuantumRelationshipsContent } from '@/components/challenges/quantum-relationships/quantum-relationships';
import { getMoneyBlocksClearingContent } from '@/components/challenges/money-blocks-clearing/money-blocks-clearing';

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