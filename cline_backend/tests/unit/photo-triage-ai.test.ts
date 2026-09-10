import { describe, expect, it } from 'vitest';
import { validatePhotoTriageResponse } from '../../src/ai/photoTriageSchemas';
import { triagePhotoWithGeminiOrNull } from '../../src/ai/photoTriageProvider';

const FAKE_IMAGE_B64 = Buffer.from('fake-jpeg-bytes').toString('base64');

function geminiJsonResponse(payload: unknown) {
  return { candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] };
}

describe('photoTriageSchemas.validatePhotoTriageResponse', () => {
  it('accepts a well-formed response', () => {
    const result = validatePhotoTriageResponse({
      waterDepthEstimate: 'KNEE',
      visibleHazards: ['standing water', 'debris'],
      caption: 'Standing water across a residential street.',
      confidence: 0.7,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid waterDepthEstimate (never trust unvalidated model output)', () => {
    const result = validatePhotoTriageResponse({
      waterDepthEstimate: 'DEEP_OCEAN', // not in the allowed enum
      visibleHazards: [],
      caption: 'x',
      confidence: 0.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects confidence outside [0,1]', () => {
    const result = validatePhotoTriageResponse({
      waterDepthEstimate: 'NONE',
      visibleHazards: [],
      caption: 'x',
      confidence: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing caption', () => {
    const result = validatePhotoTriageResponse({ waterDepthEstimate: 'NONE', visibleHazards: [], confidence: 0.5 });
    expect(result.success).toBe(false);
  });
});

describe('photoTriageProvider.triagePhotoWithGeminiOrNull (never blocks report submission)', () => {
  it('returns null (not throws) when no API key is configured', async () => {
    const result = await triagePhotoWithGeminiOrNull(FAKE_IMAGE_B64, 'image/jpeg', { apiKey: '' });
    expect(result).toBeNull();
  });

  it('returns null (not throws) when the provider errors', async () => {
    const result = await triagePhotoWithGeminiOrNull(FAKE_IMAGE_B64, 'image/jpeg', {
      apiKey: 'test-key',
      fetchFn: (async () => {
        throw new Error('network down');
      }) as unknown as typeof fetch,
    });
    expect(result).toBeNull();
  });

  it('returns null when the model returns invalid JSON', async () => {
    const result = await triagePhotoWithGeminiOrNull(FAKE_IMAGE_B64, 'image/jpeg', {
      apiKey: 'test-key',
      fetchFn: (async () => ({
        ok: true,
        status: 200,
        json: async () => geminiJsonResponse('not-an-object'),
      })) as unknown as typeof fetch,
    });
    expect(result).toBeNull();
  });

  it('returns a validated result on a well-formed model response', async () => {
    const result = await triagePhotoWithGeminiOrNull(FAKE_IMAGE_B64, 'image/jpeg', {
      apiKey: 'test-key',
      fetchFn: (async () => ({
        ok: true,
        status: 200,
        json: async () =>
          geminiJsonResponse({
            waterDepthEstimate: 'ANKLE',
            visibleHazards: ['flooded road'],
            caption: 'Ankle-deep water covering a paved road.',
            confidence: 0.8,
          }),
      })) as unknown as typeof fetch,
    });
    expect(result).not.toBeNull();
    expect(result!.response.waterDepthEstimate).toBe('ANKLE');
    expect(result!.response.confidence).toBe(0.8);
    expect(result!.usedFallback).toBe(false);
  });

  it('returns null when the model response fails schema validation', async () => {
    const result = await triagePhotoWithGeminiOrNull(FAKE_IMAGE_B64, 'image/jpeg', {
      apiKey: 'test-key',
      fetchFn: (async () => ({
        ok: true,
        status: 200,
        json: async () => geminiJsonResponse({ waterDepthEstimate: 'INVALID_VALUE', visibleHazards: [], caption: 'x', confidence: 0.5 }),
      })) as unknown as typeof fetch,
    });
    expect(result).toBeNull();
  });
});
