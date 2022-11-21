import { isApiError } from '$lib/api/ApiError';
import { serverApiError, serverError } from '$lib/server';

type CheckParameterOptions = {
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
};

/**
 * @throws {ValidationError<ApiError>} if parameter is invalid
 */
export function checkParameter<T>(parameter: unknown, name: string, options: CheckParameterOptions): T {
  const hasValue = parameter !== null && parameter !== undefined && parameter !== '';

  if (options.required && !hasValue) {
    throw serverApiError(400, 'BAD_REQUEST', `Parameter '${name}' is required`);
  }

  if (hasValue && options.type) {
    let failed = false;
    let value: unknown = null;
    switch (options.type) {
      case 'number': {
        value = parseFloat(parameter as string);
        failed = Number.isNaN(value);
        break;
      }
      case 'boolean': {
        value = parameter === 'true';
        failed = parameter !== 'true' && parameter !== 'false';
        break;
      }
      case 'array': {
        value = parameter;
        failed = !Array.isArray(parameter);
        break;
      }
      default: {
        value = parameter;
        break;
      }
    }
    if (failed) {
      throw serverApiError(400, 'BAD_REQUEST', `Parameter '${name}' must be ${options.type}`);
    }
    return value as T;
  }

  return parameter as T;
}

export function getNumberUrlParameter(url: URL, name: string) {
  const parameter = url.searchParams.get(name);
  return checkParameter<number>(parameter, name, { type: 'number', required: true });
}
export function getNumberOptionalUrlParameter(url: URL, name: string) {
  const parameter = url.searchParams.get(name);
  return checkParameter<number | null>(parameter, name, { type: 'number' });
}

export function checkFormDataParameter<T = FormDataEntryValue | null>(
  data: FormData,
  name: string,
  options: CheckParameterOptions,
): T {
  const parameter = data.get(name);
  if (typeof parameter !== 'string' && parameter !== null) {
    throw serverError(400, 'BAD_REQUEST', 'File is not supported');
  }
  try {
    return checkParameter(parameter, name, options);
  } catch (e) {
    if (isApiError(e)) {
      throw serverError(e.status, e.code, e.message);
    }
    throw e;
  }
}

export function getStringFormParameter(data: FormData, name: string) {
  return checkFormDataParameter<string>(data, name, { type: 'string', required: true });
}

export function getStringOptionalFormParameter(data: FormData, name: string) {
  return checkFormDataParameter<string | null>(data, name, { type: 'string' });
}

export function getNumberFormParameter(data: FormData, name: string) {
  return checkFormDataParameter<number>(data, name, { type: 'number', required: true });
}

export function getNumberOptionalFormParameter(data: FormData, name: string) {
  return checkFormDataParameter<number | null>(data, name, { type: 'number' });
}
