import { serverError } from '$lib/server';

type CheckParameterOptions = {
  type?: 'string' | 'number' | 'boolean' | 'object';
  required?: boolean;
};

/**
 * @throws {ValidationError<ApiError>} if parameter is invalid
 */
export function checkParameter<T = FormDataEntryValue | null>(
  data: FormData,
  name: string,
  options: CheckParameterOptions,
): T {
  const parameter = data.get(name);

  const hasValue = parameter !== null && parameter !== undefined && parameter !== '';

  if (options.required && !hasValue) {
    throw serverError(400, 'BAD_REQUEST', `Parameter '${name}' is required`);
  }

  if (hasValue && options.type) {
    let failed = false;
    let value: unknown = null;
    switch (options.type) {
      case 'number': {
        value = parseInt(parameter as string);
        failed = Number.isNaN(value);
        break;
      }
      case 'boolean': {
        value = parameter === 'true';
        failed = parameter !== 'true' && parameter !== 'false';
        break;
      }
      default: {
        value = parameter;
        break;
      }
    }
    if (failed) {
      throw serverError(400, 'BAD_REQUEST', `Parameter '${name}' must be ${options.type}`);
    }
    return value as T;
  }

  return parameter as T;
}

export function getStringParameterOrThrow(data: FormData, name: string) {
  return checkParameter<string>(data, name, { type: 'string', required: true });
}

export function getStringOptionalParameterOrThrow(data: FormData, name: string) {
  return checkParameter<string | null>(data, name, { type: 'string' });
}

export function getNumberParameterOrThrow(data: FormData, name: string) {
  return checkParameter<number>(data, name, { type: 'number', required: true });
}

export function getNumberOptionalParameterOrThrow(data: FormData, name: string) {
  return checkParameter<number | null>(data, name, { type: 'number' });
}
