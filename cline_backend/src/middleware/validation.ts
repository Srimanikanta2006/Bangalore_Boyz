import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { Errors } from '../utils/errors';

type ValidationSource = 'body' | 'query' | 'params';

/**
 * Zod validation middleware. Replaces req[source] with the parsed value so
 * downstream code only ever sees validated, typed input.
 */
export function validate(schema: ZodTypeAny, source: ValidationSource = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(Errors.validation(flattenZodError(result.error)));
    }
    if (source === 'body') {
      req.body = result.data;
    } else if (source === 'query') {
      req.query = result.data as typeof req.query;
    } else {
      req.params = result.data as typeof req.params;
    }
    next();
  };
}

export function flattenZodError(error: ZodError): Record<string, string[]> {
  const flattened = error.flatten();
  const fieldErrors: Record<string, string[]> = { ...(flattened.fieldErrors as Record<string, string[]>) };
  if (flattened.formErrors.length > 0) {
    fieldErrors._form = flattened.formErrors;
  }
  return fieldErrors;
}

