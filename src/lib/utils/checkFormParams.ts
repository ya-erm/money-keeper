import { ApiError } from '$lib/api/ApiError';
import { checkParameter, type CheckParameterOptions } from '$lib/utils';

/**
 * Extract parameter from FormData and validate it
 * @throws {ValidationError<ApiError>} if parameter is invalid
 * */
export function checkFormDataParameter<T = FormDataEntryValue | null>(
  data: FormData,
  name: string,
  options: CheckParameterOptions,
): T {
  const parameter = data.get(name);
  if (typeof parameter !== 'string' && parameter !== null) {
    throw new ApiError(400, 'BAD_REQUEST', `File is not supported`);
  }
  if (options.type === 'array') {
    return checkParameter(parameter ? parameter.split(',') : null, name, options);
  }
  return checkParameter(parameter, name, options);
}

export function checkStringFormParameter(data: FormData, name: string) {
  return checkFormDataParameter<string>(data, name, { type: 'string', required: true });
}

export function checkStringOptionalFormParameter(data: FormData, name: string) {
  return checkFormDataParameter<string | null>(data, name, { type: 'string' });
}

export function checkNumberFormParameter(data: FormData, name: string) {
  return checkFormDataParameter<number>(data, name, { type: 'number', required: true });
}

export function checkNumberOptionalFormParameter(data: FormData, name: string) {
  return checkFormDataParameter<number | null>(data, name, { type: 'number' });
}

export function checkArrayFormParameter<T>(data: FormData, name: string) {
  return checkFormDataParameter<Array<T>>(data, name, { type: 'array', required: true });
}

export function checkArrayOptionalFormParameter<T>(data: FormData, name: string) {
  return checkFormDataParameter<Array<T> | null>(data, name, { type: 'array' });
}
