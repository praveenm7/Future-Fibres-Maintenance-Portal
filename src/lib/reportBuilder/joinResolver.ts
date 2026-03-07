import { JOINS } from './metadataRegistry';
import type { JoinMeta } from '@/types/reportBuilder';

/**
 * BFS-based join resolver: given a primary table and a set of required tables,
 * finds the minimal set of joins to connect them all.
 *
 * Used on the frontend for UI feedback (e.g., "This report will combine Machines + Spare Parts").
 */
export function resolveJoinPath(primaryTable: string, requiredTables: string[]): JoinMeta[] {
  if (requiredTables.length === 0) return [];

  // Build bidirectional adjacency
  const adjacency = new Map<string, Array<{ join: JoinMeta; neighbor: string }>>();

  for (const j of JOINS) {
    if (!adjacency.has(j.from)) adjacency.set(j.from, []);
    if (!adjacency.has(j.to)) adjacency.set(j.to, []);
    adjacency.get(j.from)!.push({ join: j, neighbor: j.to });
    adjacency.get(j.to)!.push({ join: j, neighbor: j.from });
  }

  const resolvedJoins: JoinMeta[] = [];
  const connected = new Set([primaryTable]);

  for (const target of requiredTables) {
    if (connected.has(target)) continue;

    // BFS from any connected node to target
    const queue: string[] = [...connected];
    const visited = new Set<string>(connected);
    const parentMap = new Map<string, { from: string; join: JoinMeta }>();

    let found = false;
    while (queue.length > 0 && !found) {
      const current = queue.shift()!;
      const edges = adjacency.get(current) ?? [];

      for (const { join, neighbor } of edges) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        parentMap.set(neighbor, { from: current, join });

        if (neighbor === target) {
          // Trace path back
          let node = target;
          const path: JoinMeta[] = [];
          while (parentMap.has(node)) {
            const { join: j } = parentMap.get(node)!;
            path.unshift(j);
            // Move to the parent node
            node = parentMap.get(node)!.from;
          }
          resolvedJoins.push(...path);
          connected.add(target);
          found = true;
          break;
        }

        queue.push(neighbor);
      }
    }

    if (!found) {
      console.warn(`Cannot resolve join path from "${primaryTable}" to "${target}"`);
    }
  }

  return resolvedJoins;
}

/**
 * Get a human-readable description of which tables will be joined.
 */
export function describeJoinPath(dataSources: string[]): string {
  if (dataSources.length <= 1) return '';
  return `Combining: ${dataSources.join(' + ')}`;
}
