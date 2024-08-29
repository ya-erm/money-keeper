import { ApiError } from '$lib/api/ApiError';

export type CheckParameterType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export type CheckParameterOptions = {
  type?: CheckParameterType;
  required?: boolean;
};

/**
 * @throws {ApiError} if parameter is invalid
 */
export function checkParameter<T>(parameter: unknown, name: string, options: CheckParameterOptions): T {
  const hasValue = parameter !== null && parameter !== undefined && parameter !== '';

  if (options.required && !hasValue) {
    throw new ApiError(400, 'BAD_REQUEST', `Parameter '${name}' is required`);
  }

  if (hasValue && options.type) {
    let failed = false;
    let value: unknown = null;
    switch (options.type) {
      case 'number': {
        value = Number.parseFloat(parameter as string);
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
      throw new ApiError(400, 'BAD_REQUEST', `Parameter '${name}' must be ${options.type}`);
    }
    return value as T;
  }

  return parameter as T;
}

export function checkStringParameter(parameter: unknown, name: string) {
  return checkParameter<string>(parameter, name, { type: 'string', required: true });
}

export function checkStringOptionalParameter(parameter: unknown, name: string) {
  return checkParameter<string | null>(parameter, name, { type: 'string', required: false });
}

export function checkNumberParameter(parameter: unknown, name: string) {
  return checkParameter<number>(parameter, name, { type: 'number', required: true });
}

export function checkNumberOptionalParameter(parameter: unknown, name: string) {
  return checkParameter<number | null>(parameter, name, { type: 'number', required: false });
}

export function checkArrayParameter<T>(parameter: unknown, name: string, options?: CheckParameterOptions) {
  let items = checkParameter<Array<T>>(parameter, name, { type: 'array', required: true });
  if (options) {
    items = items.map((item, i) => checkParameter(item, `name.${i}`, options));
  }
  return items;
}

export function checkArrayOptionalParameter<T>(parameter: unknown, name: string, options?: CheckParameterOptions) {
  let items = checkParameter<Array<T> | null>(parameter, name, { type: 'array', required: false });
  if (options && items) {
    items = items?.map((item, i) => checkParameter(item, `name.${i}`, options));
  }
  return items;
}

// URL parameters

export function checkNumberUrlParameter(url: URL, name: string) {
  const parameter = url.searchParams.get(name);
  return checkParameter<number>(parameter, name, { type: 'number', required: true });
}
export function checkNumberOptionalUrlParameter(url: URL, name: string) {
  const parameter = url.searchParams.get(name);
  return checkParameter<number | null>(parameter, name, { type: 'number' });
}
