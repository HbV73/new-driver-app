import { getDriverApi, type ProofOfCollectionInput } from '@/services/driverApi';

export type POCInput = ProofOfCollectionInput;

export async function submitProofOfCollection(
  input: POCInput,
): Promise<{
  ok: boolean;
  queued: boolean;
  proofOfCollectionId?: string;
  clientMutationId?: string;
  clientProofId?: string;
  queuedMutationId?: string;
}> {
  const result = await getDriverApi().submitProofOfCollection(input);
  return {
    ok: result.ok,
    queued: Boolean(result.queued),
    proofOfCollectionId: result.proofOfCollectionId ?? result.id,
    clientMutationId: result.clientMutationId,
    clientProofId: result.clientProofId,
    queuedMutationId: result.queuedMutationId,
  };
}
