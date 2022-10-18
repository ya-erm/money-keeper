/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/**
 * User
 */
export interface User {
  id: number;
  name: string;
  phone: string;
  /** @format email */
  email?: string;
}

/**
 * Account
 */
export interface Account {
  id: number;
  name: string;
  currency: string;
  icon?: string;
  color?: string;
  order?: number;
}

/**
 * Group
 */
export interface Group {
  id: number;
  name: string;
}

/**
 * GroupWithUsers
 */
export interface GroupWithUsers {
  id: number;
  name: string;
  users?: User[];
}

/**
 * Category
 */
export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  order?: number;
}

/**
 * Transaction
 */
export interface Transaction {
  id: string;
  /** @format date-time */
  date: string;
  amount: number;
  coment?: string;
  categoryId: number;
  accountId: number;
  linkedTransactionId?: number | null;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, 'body' | 'bodyUsed'>;

export interface FullRequestParams extends Omit<RequestInit, 'body'> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<FullRequestParams, 'body' | 'method' | 'query' | 'path'>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, 'baseUrl' | 'cancelToken' | 'signal'>;
  securityWorker?: (securityData: SecurityDataType | null) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown> extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = 'application/json',
  FormData = 'multipart/form-data',
  UrlEncoded = 'application/x-www-form-urlencoded',
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = 'http://localhost:4000';
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>['securityWorker'];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) => fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: 'same-origin',
    headers: {},
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === 'number' ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join('&');
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter((key) => 'undefined' !== typeof query[key]);
    return keys
      .map((key) => (Array.isArray(query[key]) ? this.addArrayQueryParam(query, key) : this.addQueryParam(query, key)))
      .join('&');
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : '';
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === 'object' || typeof input === 'string') ? JSON.stringify(input) : input,
    [ContentType.FormData]: (input: any) =>
      Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === 'object' && property !== null
            ? JSON.stringify(property)
            : `${property}`,
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(params1: RequestParams, params2?: RequestParams): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (cancelToken: CancelToken): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === 'boolean' ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(`${baseUrl || this.baseUrl || ''}${path}${queryString ? `?${queryString}` : ''}`, {
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type && type !== ContentType.FormData ? { 'Content-Type': type } : {}),
      },
      signal: cancelToken ? this.createAbortSignal(cancelToken) : requestParams.signal,
      body: typeof body === 'undefined' || body === null ? null : payloadFormatter(body),
    }).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title API 1
 * @version 1.0
 * @baseUrl http://localhost:4000
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  auth = {
    /**
     * @description User registration
     *
     * @name Register
     * @summary Register
     * @request POST:/auth/register
     */
    register: (
      data: {
        phone: string;
        /** @format password */
        password: string;
        name?: string;
        /** @format email */
        email?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/auth/register`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Log in
     *
     * @name Login
     * @summary Login
     * @request POST:/auth/login
     */
    login: (
      data: {
        login: string;
        /** @format password */
        password: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          user?: User;
        },
        void
      >({
        path: `/auth/login`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),
  };
  groups = {
    /**
     * @description Get user's groups
     *
     * @name GetGroups
     * @summary GetGroups
     * @request GET:/groups
     * @secure
     */
    getGroups: (params: RequestParams = {}) =>
      this.request<
        {
          items: Group[];
        },
        void
      >({
        path: `/groups`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Create new grooup
     *
     * @name CreateGroup
     * @summary CreateGroup
     * @request POST:/groups
     * @secure
     */
    createGroup: (
      data: {
        name: string;
        users?: string[];
      },
      params: RequestParams = {},
    ) =>
      this.request<Group, any>({
        path: `/groups`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get group
     *
     * @name GetGroup
     * @summary Get group
     * @request GET:/groups/{groupId}
     * @secure
     */
    getGroup: (groupId: number, params: RequestParams = {}) =>
      this.request<GroupWithUsers, void>({
        path: `/groups/${groupId}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Update group
     *
     * @name UpdateGroup
     * @summary Update group
     * @request PUT:/groups/{groupId}
     * @secure
     */
    updateGroup: (
      groupId: number,
      data: {
        name: string;
        users: string[];
      },
      params: RequestParams = {},
    ) =>
      this.request<GroupWithUsers, void>({
        path: `/groups/${groupId}`,
        method: 'PUT',
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * @description Delete group
     *
     * @name DeleteGroup
     * @summary Delete group
     * @request DELETE:/groups/{groupId}
     * @secure
     */
    deleteGroup: (groupId: number, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/groups/${groupId}`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),
  };
  accounts = {
    /**
     * @description Get accounts owned by group
     *
     * @name GetAccounts
     * @summary Get accounts
     * @request GET:/accounts
     * @secure
     */
    getAccounts: (
      query: {
        /** Unique identifier of group */
        groupId: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          items?: Account[];
        },
        void
      >({
        path: `/accounts`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Create new account
     *
     * @name CreateAccount
     * @summary Create account
     * @request POST:/accounts
     * @secure
     */
    createAccount: (
      query: {
        /** Unique identifier of group */
        groupId: number;
      },
      data: {
        name: string;
        currency: string;
        icon?: string;
        color?: string;
        order?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/accounts`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Get account
     *
     * @name GetAccount
     * @summary Get account
     * @request GET:/accounts/{accountId}
     * @secure
     */
    getAccount: (accountId: string, params: RequestParams = {}) =>
      this.request<Account, void>({
        path: `/accounts/${accountId}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Update account
     *
     * @name UpdateAccount
     * @summary Update account
     * @request PUT:/accounts/{accountId}
     * @secure
     */
    updateAccount: (accountId: string, data: Account, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/accounts/${accountId}`,
        method: 'PUT',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Delete account
     *
     * @name DeleteAccount
     * @summary Delete account
     * @request DELETE:/accounts/{accountId}
     * @secure
     */
    deleteAccount: (accountId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/accounts/${accountId}`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),
  };
  categories = {
    /**
     * @description Get categories owned by group
     *
     * @name GetCategories
     * @summary Get categories
     * @request GET:/categories
     * @secure
     */
    getCategories: (
      query: {
        /** Unique identifier of group */
        groupId: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          items?: Category[];
        },
        void
      >({
        path: `/categories`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Create new category
     *
     * @name CreateCategory
     * @summary Create category
     * @request POST:/categories
     * @secure
     */
    createCategory: (
      query: {
        /** Unique identifier of group */
        groupId: number;
      },
      data: {
        name: string;
        color?: string;
        icon?: string;
        order?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/categories`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Get category
     *
     * @name GetCategory
     * @summary Get category
     * @request GET:/categories/{categoryId}
     * @secure
     */
    getCategory: (categoryId: string, params: RequestParams = {}) =>
      this.request<Category, void>({
        path: `/categories/${categoryId}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Update category
     *
     * @name UpdateCategory
     * @request PUT:/categories/{categoryId}
     * @secure
     */
    updateCategory: (categoryId: string, data: Category, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/categories/${categoryId}`,
        method: 'PUT',
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Delete category
     *
     * @name DeleteCategory
     * @summary Delete category
     * @request DELETE:/categories/{categoryId}
     * @secure
     */
    deleteCategory: (categoryId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/categories/${categoryId}`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),
  };
  transactions = {
    /**
     * @description Get transactions owned by group with pagination
     *
     * @name GetAllTransactions
     * @summary Get transactions
     * @request GET:/transactions
     * @secure
     */
    getAllTransactions: (
      query: {
        /** Unique identifier of group */
        groupId: number;
        /** How much items to skip */
        skip: number;
        /** How much items to take */
        take: number;
        /** Unique identifier of account */
        accountId?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          total?: number;
          items?: Transaction[];
        },
        any
      >({
        path: `/transactions`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Create new transaction
     *
     * @name CreateTransaction
     * @summary Create transaction
     * @request POST:/transactions
     * @secure
     */
    createTransaction: (
      query: {
        /** Unique identifier of group */
        groupId: number;
      },
      data: {
        /** @format date-time */
        date: string;
        amount: number;
        coment?: string;
        categoryId: number;
        accountId: number;
        linkedTransactionId?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<Transaction, any>({
        path: `/transactions`,
        method: 'POST',
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * @description Get transaction
     *
     * @name GetTransaction
     * @summary Get transaction
     * @request GET:/transactions/{transactionId}
     * @secure
     */
    getTransaction: (transactionId: number, params: RequestParams = {}) =>
      this.request<Transaction, void>({
        path: `/transactions/${transactionId}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Update transaction
     *
     * @name UpdateTransaction
     * @summary Update transaction
     * @request PUT:/transactions/{transactionId}
     * @secure
     */
    updateTransaction: (transactionId: number, data: Transaction, params: RequestParams = {}) =>
      this.request<Transaction, void>({
        path: `/transactions/${transactionId}`,
        method: 'PUT',
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * @description Delete transaction
     *
     * @name DeleteTransaction
     * @summary Delete transaction
     * @request DELETE:/transactions/{transactionId}
     * @secure
     */
    deleteTransaction: (transactionId: number, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/transactions/${transactionId}`,
        method: 'DELETE',
        secure: true,
        ...params,
      }),
  };
  users = {
    /**
     * @description Get user
     *
     * @name GetUser
     * @summary Get user
     * @request GET:/users/{userId}
     * @secure
     */
    getUser: (userId: string, params: RequestParams = {}) =>
      this.request<User, void>({
        path: `/users/${userId}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * @description Update user
     *
     * @name UpdateUser
     * @summary Update user
     * @request PUT:/users/{userId}
     * @secure
     */
    updateUser: (userId: string, data: User, params: RequestParams = {}) =>
      this.request<User, void>({
        path: `/users/${userId}`,
        method: 'PUT',
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),
  };
}
