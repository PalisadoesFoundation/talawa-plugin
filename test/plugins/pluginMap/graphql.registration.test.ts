import { describe, it, expect } from 'vitest';
import { registerPluginMapMutations } from '../../../plugins/Plugin Map/api/graphql/mutations';
import { registerPluginMapQueries } from '../../../plugins/Plugin Map/api/graphql/queries';
import { mockBuilder } from '../../setup/globalMocks';

describe('Plugin Map GraphQL Registration', () => {
  it('should register all mutations', () => {
    registerPluginMapMutations(mockBuilder as any);
    expect(mockBuilder.mutationField).toHaveBeenCalled();
  });

  it('should register all queries', () => {
    registerPluginMapQueries(mockBuilder as any);
    expect(mockBuilder.queryType).not.toHaveBeenCalled(); // registerPluginMapQueries doesn't call queryType directly usually, it uses queryField
    expect(mockBuilder.queryField).toHaveBeenCalled();
  });
});
